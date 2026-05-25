const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Temporary stub — will be implemented in Phase 3
router.get('/', requireAuth, (req, res) => {
  res.redirect(`${req.basePath}/dashboard`);
});

router.get('/create', requireAuth, (req, res) => {
  res.redirect(`${req.basePath}/dashboard`);
});

module.exports = router;
