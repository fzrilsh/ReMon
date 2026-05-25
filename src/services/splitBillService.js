const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const transactionRepository = require('../repositories/transactionRepository');
const splitBillRepository = require('../repositories/splitBillRepository');
const notificationService = require('./notificationService');

const prisma = new PrismaClient();

async function getAll(userId) {
  return splitBillRepository.findByUserId(userId);
}

async function getById(id) {
  const splitBill = await splitBillRepository.findById(id);
  if (!splitBill) {
    const error = new Error('Split bill tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  return splitBill;
}

async function getBySlug(slug) {
  const splitBill = await splitBillRepository.findBySlug(slug);
  if (!splitBill) {
    const error = new Error('Split bill tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  return splitBill;
}

function calculateEqualSplit(totalAmount, participantCount) {
  const amountPerPerson = Math.floor(totalAmount / participantCount);
  const remainder = totalAmount - (amountPerPerson * participantCount);
  
  const amounts = Array(participantCount).fill(amountPerPerson);
  // Distribute remainder (1 rupiah) to first `remainder` participants
  for (let i = 0; i < remainder; i++) {
    amounts[i] += 1;
  }
  
  return amounts;
}

async function create(userId, { transactionIds, participants }) {
  if (!transactionIds || transactionIds.length === 0) {
    const error = new Error('Pilih minimal 1 transaksi');
    error.statusCode = 400;
    throw error;
  }

  const transactions = [];
  let totalAmount = 0;
  let descriptions = [];

  for (const id of transactionIds) {
    const transaction = await transactionRepository.findById(id);
    if (!transaction) {
      const error = new Error('Transaksi tidak ditemukan: ' + id);
      error.statusCode = 404;
      throw error;
    }
    if (transaction.userId !== userId) {
      const error = new Error('Transaksi tidak ditemukan');
      error.statusCode = 404;
      throw error;
    }
    if (transaction.type !== 'EXPENSE') {
      const error = new Error('Hanya transaksi pengeluaran yang bisa di-split');
      error.statusCode = 400;
      throw error;
    }
    transactions.push(transaction);
    totalAmount += Number(transaction.amount);
    descriptions.push(transaction.description);
  }

  const nameList = typeof participants === 'string'
    ? participants.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    : (Array.isArray(participants) ? participants : []);
  const participantNames = [...new Set(nameList)];
  if (participantNames.length === 0) {
    const error = new Error('Masukkan minimal 1 peserta');
    error.statusCode = 400;
    throw error;
  }
  // Include the owner (+1) so total is split among all people including the one who paid
  const amounts = calculateEqualSplit(totalAmount, participantNames.length + 1);
  const slug = nanoid(10);

  const splitBill = await splitBillRepository.create({
    userId,
    totalAmount,
    slug,
    description: descriptions.join(', '),
    status: 'ACTIVE',
    participants: {
      create: participantNames.map((name, i) => ({
        name,
        amount: amounts[i],
        status: 'UNPAID',
      })),
    },
    transactions: {
      create: transactions.map(t => ({ transactionId: t.id })),
    },
  });

  return splitBill;
}

async function close(id, userId) {
  const splitBill = await getById(id);
  if (splitBill.userId !== userId) {
    const error = new Error('Split bill tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }
  
  const unpaid = splitBill.participants.filter(p => p.status === 'UNPAID');
  if (unpaid.length > 0) {
    const error = new Error('Masih ada peserta yang belum membayar');
    error.statusCode = 400;
    throw error;
  }
  
  return splitBillRepository.updateStatus(id, 'CLOSED');
}

async function getExpenseTransactions(userId) {
  return transactionRepository.findByUserId(userId, { type: 'EXPENSE', isSplitBill: false });
}

// Public: Get split bill for pay page
async function getPublicSplitBill(slug) {
  return getBySlug(slug);
}

// Public: Submit payment proof
async function submitPayment(slug, { name, proofPath }) {
  const splitBill = await getBySlug(slug);
  
  if (splitBill.status === 'CLOSED') {
    const error = new Error('Split bill ini sudah ditutup');
    error.statusCode = 400;
    throw error;
  }
  
  const participant = splitBill.participants.find(p => p.name === name);
  if (!participant) {
    const error = new Error('Nama tidak ditemukan dalam split bill ini');
    error.statusCode = 400;
    throw error;
  }
  
  if (participant.status === 'PAID') {
    const error = new Error('Kamu sudah membayar split bill ini');
    error.statusCode = 400;
    throw error;
  }

  // Update participant with proof image
  await prisma.splitBillParticipant.update({
    where: { id: participant.id },
    data: { paymentProofImage: proofPath },
  });

  // Verify with AI (will be done asynchronously or via separate endpoint)
  // For now, mark as PAID - AI verification will be called from controller
  return participant;
}

async function verifyAndUpdatePayment(participantId, verificationResult) {
  const participant = await prisma.splitBillParticipant.findUnique({
    where: { id: participantId },
    include: { splitBill: true },
  });
  
  if (!participant) {
    const error = new Error('Peserta tidak ditemukan');
    error.statusCode = 404;
    throw error;
  }

  const updates = {
    paymentVerified: verificationResult.valid,
    aiFeedback: verificationResult.reason || null,
  };

  if (verificationResult.valid) {
    updates.status = 'PAID';
    updates.paidAt = new Date();
    
    // Notify the split bill creator
    await notificationService.create({
      userId: participant.splitBill.userId,
      type: 'SPLIT_PAID',
      title: 'Split Bill Dibayar',
      message: `${participant.name} telah membayar split bill sebesar Rp ${Number(participant.amount).toLocaleString('id-ID')}`,
      link: `/ReMon/split-bills/${participant.splitBillId}`,
    });
  } else {
    updates.status = 'DISPUTED';
    
    // Notify creator about disputed payment
    await notificationService.create({
      userId: participant.splitBill.userId,
      type: 'SPLIT_DISPUTED',
      title: 'Pembayaran Ditolak',
      message: `Pembayaran dari ${participant.name} ditolak: ${verificationResult.reason || 'Bukti tidak valid'}`,
      link: `/ReMon/split-bills/${participant.splitBillId}`,
    });
  }

  return prisma.splitBillParticipant.update({
    where: { id: participantId },
    data: updates,
  });
}

module.exports = {
  getAll, getById, getBySlug, create, close,
  getExpenseTransactions, getPublicSplitBill,
  submitPayment, verifyAndUpdatePayment,
};
