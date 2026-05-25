const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', requireAuth, transactionController.index);
router.get('/create', requireAuth, transactionController.showCreate);
router.post('/', requireAuth, transactionController.store);
router.get('/receipt', requireAuth, transactionController.showReceipt);
router.post('/receipt/parse', requireAuth, upload.single('receipt'), transactionController.parseReceipt);
router.get('/:id/edit', requireAuth, transactionController.showEdit);
router.put('/:id', requireAuth, transactionController.update);
router.delete('/:id', requireAuth, transactionController.destroy);

module.exports = router;
