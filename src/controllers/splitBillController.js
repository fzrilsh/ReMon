const splitBillService = require('../services/splitBillService');
const { createSplitBillSchema } = require('../validators/splitBillSchema');

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
    const parsed = createSplitBillSchema.safeParse(req.body);
    if (!parsed.success) {
      const transactions = await splitBillService.getExpenseTransactions(req.session.user.id);
      const errors = parsed.error.flatten().fieldErrors;
      return res.status(400).render('split-bill/create', {
        title: 'Buat Split Bill',
        transactions,
        errors,
        oldInput: req.body,
      });
    }

    const splitBill = await splitBillService.create(req.session.user.id, parsed.data);
    res.redirect(`${req.basePath}/split-bills/${splitBill.id}`);
  } catch (err) {
    if (err.statusCode) {
      const transactions = await splitBillService.getExpenseTransactions(req.session.user.id);
      return res.status(err.statusCode).render('split-bill/create', {
        title: 'Buat Split Bill',
        transactions,
        errors: { general: [err.message] },
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
      return res.status(err.statusCode).render('split-bill/manage', {
        title: 'Split Bill',
        error: err.message,
      });
    }
    next(err);
  }
}

module.exports = { index, showCreate, store, detail, closeSplitBill };
