const userRepository = require('../repositories/userRepository');

async function showSettings(req, res, next) {
  try {
    const user = await userRepository.findById(req.session.user.id);
    res.render('settings/index', {
      title: 'Pengaturan',
      user,
      success: req.session.settingsSuccess || null,
      errors: null,
    });
    delete req.session.settingsSuccess;
  } catch (err) {
    next(err);
  }
}

async function saveSettings(req, res, next) {
  try {
    const { bankName, bankNumber, bankHolder } = req.body;

    const errors = {};
    if (bankName && bankName.trim().length > 100) errors.bankName = 'Nama bank terlalu panjang';
    if (bankNumber && !/^[\d\s\-]+$/.test(bankNumber.trim())) errors.bankNumber = 'Nomor rekening hanya boleh berisi angka';
    if (bankHolder && bankHolder.trim().length > 100) errors.bankHolder = 'Nama pemilik terlalu panjang';

    if (Object.keys(errors).length > 0) {
      const user = await userRepository.findById(req.session.user.id);
      return res.status(400).render('settings/index', {
        title: 'Pengaturan',
        user,
        success: null,
        errors,
      });
    }

    await userRepository.updateBankInfo(req.session.user.id, {
      bankName: bankName ? bankName.trim() : null,
      bankNumber: bankNumber ? bankNumber.replace(/\s/g, '') : null,
      bankHolder: bankHolder ? bankHolder.trim() : null,
    });

    req.session.settingsSuccess = 'Informasi rekening berhasil disimpan';
    res.redirect(`${req.basePath}/settings`);
  } catch (err) {
    next(err);
  }
}

module.exports = { showSettings, saveSettings };
