const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findByUserId(userId) {
  return prisma.splitBill.findMany({
    where: { userId },
    include: {
      transactions: { include: { transaction: true } },
      participants: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function findById(id) {
  return prisma.splitBill.findUnique({
    where: { id },
    include: {
      transactions: { include: { transaction: true } },
      participants: true,
      user: { select: { name: true } },
    },
  });
}

async function findBySlug(slug) {
  return prisma.splitBill.findUnique({
    where: { slug },
    include: {
      transactions: { include: { transaction: true } },
      participants: true,
      user: { select: { name: true, bankName: true, bankNumber: true, bankHolder: true } },
    },
  });
}

async function create(data) {
  return prisma.splitBill.create({ data });
}

async function updateStatus(id, status) {
  return prisma.splitBill.update({ where: { id }, data: { status } });
}

module.exports = { findByUserId, findById, findBySlug, create, updateStatus };
