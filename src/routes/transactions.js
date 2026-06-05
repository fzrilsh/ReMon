const express = require('express');
const multer = require('multer');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Wrapper untuk handle Multer error (ukuran/tipe file) sebagai JSON response
function uploadSingleReceipt(req, res, next) {
  upload.single('receipt')(req, res, function (err) {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ ok: false, error: 'Ukuran file terlalu besar. Maksimal 5MB.' });
      }
      return res.status(400).json({ ok: false, error: err.message || 'Gagal mengupload file.' });
    }
    next();
  });
}

router.get('/', requireAuth, transactionController.index);
router.get('/create', requireAuth, transactionController.showCreate);
router.post('/', requireAuth, transactionController.store);
router.get('/receipt', requireAuth, transactionController.showReceipt);
router.post('/receipt/parse', requireAuth, uploadSingleReceipt, transactionController.parseReceipt);
router.get('/:id/edit', requireAuth, transactionController.showEdit);
router.put('/:id', requireAuth, transactionController.update);
router.delete('/:id', requireAuth, transactionController.destroy);

module.exports = router;
