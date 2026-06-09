const path = require('path');
const splitBillService = require('../services/splitBillService');
const aiService = require('../services/aiService');
const { paySplitBillSchema } = require('../validators/splitBillSchema');

async function showPay(req, res, next) {
  try {
    const splitBill = await splitBillService.getPublicSplitBill(req.params.slug);
    const bank = splitBill.user || {};
    res.render('public/split-pay', {
      title: 'Bayar Split Bill',
      splitBill,
      bankName: bank.bankName || null,
      bankNumber: bank.bankNumber || null,
      bankHolder: bank.bankHolder || null,
      errors: null,
      paid: false,
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Link split bill tidak valid',
        error: null,
      });
    }
    next(err);
  }
}

async function submitPay(req, res, next) {
  try {
    const splitBill = await splitBillService.getPublicSplitBill(req.params.slug);
    const bank = splitBill.user || {};
    const bankProps = {
      bankName: bank.bankName || null,
      bankNumber: bank.bankNumber || null,
      bankHolder: bank.bankHolder || null,
    };
    
    if (splitBill.status === 'CLOSED') {
      return res.render('public/split-pay', {
        title: 'Bayar Split Bill',
        splitBill,
        ...bankProps,
        errors: { general: 'Split bill ini sudah ditutup' },
        paid: false,
      });
    }

    const parsed = paySplitBillSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return res.status(400).render('public/split-pay', {
        title: 'Bayar Split Bill',
        splitBill,
        ...bankProps,
        errors,
        paid: false,
      });
    }

    if (!req.file) {
      return res.render('public/split-pay', {
        title: 'Bayar Split Bill',
        splitBill,
        ...bankProps,
        errors: { proof: 'Bukti transfer wajib diupload' },
        paid: false,
      });
    }

    const participant = await splitBillService.submitPayment(req.params.slug, {
      name: parsed.data.name,
      proofPath: req.file.path,
    });

    // Verify with AI in the background without blocking the HTTP response
    aiService.verifyPaymentProof(req.file.path, Number(participant.amount), bankProps)
      .then(verificationResult => {
        return splitBillService.verifyAndUpdatePayment(participant.id, verificationResult);
      })
      .catch(err => {
        console.error('Error during background AI verification:', err);
        return splitBillService.verifyAndUpdatePayment(participant.id, {
          valid: false,
          reason: 'Gagal melakukan verifikasi otomatis (sistem error).'
        });
      });

    res.render('public/split-pay', {
      title: 'Pembayaran Diproses — ReMon',
      splitBill,
      ...bankProps,
      errors: null,
      paid: false,
      processing: true,
      paidParticipant: parsed.data.name,
      paidAmount: Number(participant.amount).toLocaleString('id-ID'),
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).render('public/split-pay', {
        title: 'Bayar Split Bill',
        splitBill: err.statusCode === 400 ? {} : null,
        errors: { general: err.message },
        paid: false,
      });
    }
    next(err);
  }
}

module.exports = { showPay, submitPay };
