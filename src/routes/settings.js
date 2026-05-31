const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, settingsController.showSettings);
router.post('/', requireAuth, settingsController.saveSettings);

module.exports = router;
