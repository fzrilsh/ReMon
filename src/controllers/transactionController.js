const transactionService = require('../services/transactionService');

async function index(req, res, next) {
  try {
    const transactions = await transactionService.getAll(req.session.user.id);
    res.render('transactions/list', {
      title: 'Transaksi',
      transactions,
    });
  } catch (err) {
    next(err);
  }
}

async function showCreate(req, res, next) {
  try {
    const categories = await transactionService.getCategories();
    res.render('transactions/create', {
      title: 'Tambah Transaksi',
      categories,
      errors: null,
      oldInput: {},
      receiptData: {},
    });
  } catch (err) {
    next(err);
  }
}

async function store(req, res, next) {
  try {
    await transactionService.create(req.session.user.id, req.body);
    res.redirect(`${req.basePath}/transactions`);
  } catch (err) {
    const categories = await transactionService.getCategories();
    res.render('transactions/create', {
      title: 'Tambah Transaksi',
      categories,
      errors: { general: err.message },
      oldInput: req.body,
      receiptData: {},
    });
  }
}

async function showReceipt(req, res) {
  res.render('transactions/receipt', {
    title: 'Upload Struk',
    errors: null,
    receiptData: {},
  });
}

async function parseReceipt(req, res, next) {
  try {
    if (!req.file) {
      return res.render('transactions/receipt', {
        title: 'Upload Struk',
        errors: { receipt: 'File gambar wajib diupload' },
        receiptData: {},
      });
    }

    const aiService = require('../services/aiService');
    const result = await aiService.parseReceipt(req.file.path);

    if (!result.success) {
      return res.render('transactions/receipt', {
        title: 'Upload Struk',
        errors: { receipt: result.error },
        receiptData: {},
      });
    }

    const categories = await transactionService.getCategories();
    res.render('transactions/create', {
      title: 'Tambah Transaksi',
      categories,
      errors: null,
      oldInput: {
        type: 'EXPENSE',
        amount: result.data.total_amount,
        description: result.data.store_name || '',
        date: result.data.date || new Date().toISOString().split('T')[0],
      },
      receiptData: result.data,
    });
  } catch (err) {
    next(err);
  }
}

async function showEdit(req, res, next) {
  try {
    const transaction = await transactionService.getById(req.params.id);
    const categories = await transactionService.getCategories();
    res.render('transactions/edit', {
      title: 'Edit Transaksi',
      transaction,
      categories,
      errors: null,
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    await transactionService.update(req.params.id, req.session.user.id, req.body);
    res.redirect(`${req.basePath}/transactions`);
  } catch (err) {
    const transaction = await transactionService.getById(req.params.id);
    const categories = await transactionService.getCategories();
    res.render('transactions/edit', {
      title: 'Edit Transaksi',
      transaction: { ...transaction, ...req.body },
      categories,
      errors: { general: err.message },
    });
  }
}

async function destroy(req, res, next) {
  try {
    await transactionService.remove(req.params.id, req.session.user.id);
    res.redirect(`${req.basePath}/transactions`);
  } catch (err) {
    next(err);
  }
}

module.exports = { index, showCreate, store, showReceipt, parseReceipt, showEdit, update, destroy };
