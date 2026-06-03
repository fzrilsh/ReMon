const transactionService = require('../services/transactionService');

async function index(req, res, next) {
  try {
    const { categoryId, monthYear } = req.query;
    const filters = {};
    if (categoryId) {
      if (categoryId === 'none') {
        filters.categoryId = null;
      } else {
        filters.categoryId = categoryId;
      }
    }
    if (monthYear) {
      const [yearStr, monthStr] = monthYear.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1;
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      filters.date = {
        gte: startDate,
        lte: endDate,
      };
    }
    const transactions = await transactionService.getAll(req.session.user.id, filters);
    const categories = await transactionService.getCategories();
    res.render('transactions/list', {
      title: 'Transaksi',
      transactions,
      categories,
      selectedCategoryId: categoryId || '',
      selectedMonthYear: monthYear || '',
    });
  } catch (err) {
    next(err);
  }
}

async function showCreate(req, res, next) {
  try {
    const categories = await transactionService.getCategories();

    // Load receipt data from session if present (after synchronous parse)
    let receiptData = {};
    let oldInput = {};
    if (req.session.pendingReceiptData) {
      receiptData = req.session.pendingReceiptData;
      delete req.session.pendingReceiptData;

      // Pre-fill oldInput from receipt data
      oldInput = {
        type: 'EXPENSE',
        amount: receiptData.total_amount,
        description: receiptData.store_name || '',
        date: receiptData.date || new Date().toISOString().split('T')[0],
      };

      // Match category by name
      if (receiptData.category_name) {
        const matched = categories.find(
          (c) => c.name.toLowerCase() === receiptData.category_name.toLowerCase()
        );
        if (matched) oldInput.categoryId = matched.id;
      }
    }

    res.render('transactions/create', {
      title: 'Tambah Transaksi',
      categories,
      errors: null,
      oldInput,
      receiptData,
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

    // Save receipt data to session so showCreate can pick it up
    req.session.pendingReceiptData = result.data;

    // Create a notification so user can access receipt data anytime
    const notificationService = require('../services/notificationService');
    const storeName = result.data.store_name || 'Struk';
    const amount = Number(result.data.total_amount || 0).toLocaleString('id-ID');
    await notificationService.create({
      userId: req.session.user.id,
      type: 'RECEIPT_READY',
      title: '✅ Struk berhasil diproses',
      message: `Data dari ${storeName} (Rp ${amount}) siap dicatat.`,
      link: `${req.basePath}/transactions/create`,
    });

    // Redirect directly to create transaction (synchronous flow)
    // Use session.save() to ensure the data is persisted before redirect
    req.session.save((err) => {
      if (err) return next(err);
      res.redirect(`${req.basePath}/transactions/create`);
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
