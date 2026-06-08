const express = require('express');
const router = express.Router();
const splitBillController = require('../controllers/splitBillController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, splitBillController.index);
router.get('/create', requireAuth, splitBillController.showCreate);
router.post('/', requireAuth, splitBillController.store);
router.get('/:id', requireAuth, splitBillController.detail);
router.patch('/:id/close', requireAuth, splitBillController.closeSplitBill);
router.patch('/participants/:participantId/paid', requireAuth, splitBillController.markParticipantPaid);

module.exports = router;
