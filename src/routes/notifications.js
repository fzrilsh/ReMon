const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Temporary stub — will be implemented in Phase 3
router.get('/unread', requireAuth, (req, res) => {
  res.json([]);
});

router.patch('/:id/read', requireAuth, (req, res) => {
  res.json({ ok: true });
});

router.patch('/read-all', requireAuth, (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
