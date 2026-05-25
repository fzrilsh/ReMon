const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const upload = require('../middleware/upload');

router.get('/:slug', publicController.showPay);
router.post('/:slug/pay', upload.single('proof'), publicController.submitPay);

module.exports = router;
