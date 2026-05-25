const splitBillService = require('../services/splitBillService');

async function index(req, res, next) {
  try {
    const splitBills = await splitBillService.getAll(req.session.user.id);
    res.render('split-bill/manage', {
      title: 'Split Bill',
      splitBills,
    });
  } catch (err) {
    next(err);
  }
}

async function showCreate(req, res, next) {
  try {
    const transactions = await splitBillService.getExpenseTransactions(req.session.user.id);
    res.render('split-bill/create', {
      title: 'Buat Split Bill',
      transactions,
      errors: null,
      oldInput: {},
    });
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  try {
    // Handle both single and array transactionIds
    let transactionIds = req.body.transactionIds;
    if (!transactionIds) transactionIds = [];
    if (!Array.isArray(transactionIds)) transactionIds = [transactionIds];

    const splitBill = await splitBillService.create(req.session.user.id, {
      transactionIds,
      participants: req.body.participants || '',
    });

    // Mark transactions as split
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    for (const id of transactionIds) {
      await prisma.transaction.update({ where: { id }, data: { isSplitBill: true } });
    }

    res.redirect(`${req.basePath}/split-bills/${splitBill.id}`);
  } catch (err) {
    if (err.statusCode) {
      const transactions = await splitBillService.getExpenseTransactions(req.session.user.id);
      const errors = {};
      if (err.message.includes('transaksi')) errors.transactionIds = [err.message];
      else errors.general = [err.message];
      return res.status(err.statusCode).render('split-bill/create', {
        title: 'Buat Split Bill',
        transactions,
        errors,
        oldInput: req.body,
      });
    }
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const splitBill = await splitBillService.getById(req.params.id);
    res.render('split-bill/detail', {
      title: 'Detail Split Bill',
      splitBill,
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Split bill tidak ditemukan',
        error: null,
      });
    }
    next(err);
  }
}

async function closeSplitBill(req, res, next) {
  try {
    await splitBillService.close(req.params.id, req.session.user.id);
    res.redirect(`${req.basePath}/split-bills`);
  } catch (err) {
    if (err.statusCode) {
      const splitBill = await splitBillService.getById(req.params.id);
      return res.status(err.statusCode).render('split-bill/detail', {
        title: 'Detail Split Bill',
        splitBill,
        error: err.message,
      });
    }
    next(err);
  }
}

module.exports = { index, showCreate, store, detail, closeSplitBill };
