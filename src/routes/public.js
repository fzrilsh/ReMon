const express = require('express');
const router = express.Router();

// Temporary stub — will be implemented in Phase 3
router.get('/:slug', (req, res) => {
  res.status(404).send('Split bill page not available yet');
});

router.post('/:slug/pay', (req, res) => {
  res.status(404).send('Split bill payment not available yet');
});

module.exports = router;
