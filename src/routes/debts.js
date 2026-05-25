const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debtController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, debtController.index);
router.get('/create', requireAuth, debtController.showCreate);
router.post('/', requireAuth, debtController.store);
router.patch('/:id/settle', requireAuth, debtController.settle);
router.delete('/:id', requireAuth, debtController.destroy);

module.exports = router;
