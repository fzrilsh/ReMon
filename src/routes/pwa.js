const express = require('express');
const router = express.Router();
const pwaController = require('../controllers/pwaController');

router.get('/manifest.json', pwaController.manifest);
router.get('/sw.js', pwaController.serviceWorker);

module.exports = router;
