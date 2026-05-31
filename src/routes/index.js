const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const transactionRoutes = require('./transactions');
const splitBillRoutes = require('./splitBill');
const debtRoutes = require('./debts');
const pwaRoutes = require('./pwa');
const publicRoutes = require('./public');
const notificationRoutes = require('./notifications');
const settingsRoutes = require('./settings');

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/transactions', transactionRoutes);
router.use('/split-bills', splitBillRoutes);
router.use('/debts', debtRoutes);
router.use('/settings', settingsRoutes);
router.use('/', pwaRoutes);
router.use('/split', publicRoutes);
router.use('/notifications', notificationRoutes);


module.exports = router;
