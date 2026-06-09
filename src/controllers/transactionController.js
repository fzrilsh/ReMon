const transactionService = require('../services/transactionService');

async function index(req, res, next) {
  try {
    if (!req.query.content) {
      return res.render('skeletons/list', { title: 'Transaksi' });
    }
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
      isPartial: true
    });
  } catch (err) {
    next(err);
  }
}

async function showCreate(req, res, next) {
  try {
    if (!req.query.content) {
      return res.render('skeletons/form', { title: 'Tambah Transaksi' });
    }
    const categories = await transactionService.getCategories();

    let receiptData = {};
    let oldInput = {};

    // Load receipt data from notification link query param (?d=base64url)
    if (req.query.d) {
      try {
        receiptData = JSON.parse(Buffer.from(req.query.d, 'base64url').toString('utf8'));

        oldInput = {
          type: 'EXPENSE',
          amount: receiptData.total_amount,
          description: receiptData.store_name || '',
          date: receiptData.date || new Date().toISOString().split('T')[0],
        };

        // Match category by name from AI
        if (receiptData.category_name) {
          const matched = categories.find(
            (c) => c.name.toLowerCase() === receiptData.category_name.toLowerCase()
          );
          if (matched) oldInput.categoryId = matched.id;
        }
      } catch (e) {
        console.error('[showCreate] Failed to decode receipt data from query param:', e.message);
      }
    }

    res.render('transactions/create', {
      title: 'Tambah Transaksi',
      categories,
      errors: null,
      oldInput,
      receiptData,
      isPartial: true
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
  if (!req.query.content) {
    return res.render('skeletons/form', { title: 'Upload Struk' });
  }
  res.render('transactions/receipt', {
    title: 'Upload Struk',
    errors: null,
    receiptData: {},
    isPartial: true
  });
}

async function parseReceipt(req, res, next) {
  try {
    if (!req.file) {
      console.warn('[parseReceipt] No file received in request');
      return res.status(400).json({ ok: false, error: 'File gambar wajib diupload' });
    }

    console.log('[parseReceipt] File received:', req.file.originalname, req.file.size, 'bytes at', req.file.path);

    // Capture needed values before handing off to background job
    const userId = req.session.user.id;
    const basePath = req.basePath;
    const filePath = req.file.path;

    // Immediately respond — user can navigate away
    res.json({ ok: true });

    // Background processing (fire and forget)
    setImmediate(async () => {
      console.log('[parseReceipt background] Starting OCR + AI for userId:', userId);
      const notificationService = require('../services/notificationService');
      try {
        const aiService = require('../services/aiService');
        const result = await aiService.parseReceipt(filePath);

        console.log('[parseReceipt background] AI result success:', result.success);

        if (!result.success) {
          await notificationService.create({
            userId,
            type: 'RECEIPT_FAILED',
            title: '❌ Gagal memproses struk',
            message: result.error || 'Tidak dapat membaca struk.',
            link: null,
          });
          return;
        }

        // Encode receipt data into link so create page can pre-fill form
        const encoded = Buffer.from(JSON.stringify(result.data)).toString('base64url');
        const storeName = result.data.store_name || 'Struk';
        const amount = Number(result.data.total_amount || 0).toLocaleString('id-ID');

        await notificationService.create({
          userId,
          type: 'RECEIPT_READY',
          title: '✅ Struk berhasil diproses',
          message: `Data dari ${storeName} (Rp ${amount}) siap dicatat. Klik untuk melanjutkan.`,
          link: `${basePath}/transactions/create?d=${encoded}`,
        });

        console.log('[parseReceipt background] Notification created for userId:', userId);
      } catch (err) {
        console.error('[parseReceipt background] Error:', err.message);
        try {
          await notificationService.create({
            userId,
            type: 'RECEIPT_FAILED',
            title: '❌ Gagal memproses struk',
            message: 'Terjadi kesalahan saat memproses struk.',
            link: null,
          });
        } catch (_) {}
      }
    });
  } catch (err) {
    next(err);
  }
}

async function showEdit(req, res, next) {
  try {
    if (!req.query.content) {
      return res.render('skeletons/form', { title: 'Edit Transaksi' });
    }
    const transaction = await transactionService.getById(req.params.id);
    const categories = await transactionService.getCategories();
    res.render('transactions/edit', {
      title: 'Edit Transaksi',
      transaction,
      categories,
      errors: null,
      isPartial: true
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

async function shareReceipt(req, res, next) {
  try {
    if (!req.file) {
      console.warn('[shareReceipt] No file received in request');
      return res.redirect(`${req.basePath}/transactions/receipt?error=${encodeURIComponent('File gambar wajib diupload')}`);
    }

    console.log('[shareReceipt] File received via share target:', req.file.originalname, req.file.size, 'bytes at', req.file.path);

    const userId = req.session.user.id;
    const basePath = req.basePath;
    const filePath = req.file.path;

    // Redirect the user to /transactions/receipt with shared=true
    res.redirect(`${basePath}/transactions/receipt?shared=true`);

    // Background processing (fire and forget)
    setImmediate(async () => {
      console.log('[shareReceipt background] Starting OCR + AI for userId:', userId);
      const notificationService = require('../services/notificationService');
      try {
        const aiService = require('../services/aiService');
        const result = await aiService.parseReceipt(filePath);

        console.log('[shareReceipt background] AI result success:', result.success);

        if (!result.success) {
          await notificationService.create({
            userId,
            type: 'RECEIPT_FAILED',
            title: '❌ Gagal memproses struk',
            message: result.error || 'Tidak dapat membaca struk.',
            link: null,
          });
          return;
        }

        const encoded = Buffer.from(JSON.stringify(result.data)).toString('base64url');
        const storeName = result.data.store_name || 'Struk';
        const amount = Number(result.data.total_amount || 0).toLocaleString('id-ID');

        await notificationService.create({
          userId,
          type: 'RECEIPT_READY',
          title: '✅ Struk berhasil diproses',
          message: `Data dari ${storeName} (Rp ${amount}) siap dicatat. Klik untuk melanjutkan.`,
          link: `${basePath}/transactions/create?d=${encoded}`,
        });

        console.log('[shareReceipt background] Notification created for userId:', userId);
      } catch (err) {
        console.error('[shareReceipt background] Error:', err.message);
        try {
          await notificationService.create({
            userId,
            type: 'RECEIPT_FAILED',
            title: '❌ Gagal memproses struk',
            message: 'Terjadi kesalahan saat memproses struk.',
            link: null,
          });
        } catch (_) {}
      }
    });
  } catch (err) {
    next(err);
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

module.exports = { index, showCreate, store, showReceipt, parseReceipt, shareReceipt, showEdit, update, destroy };
