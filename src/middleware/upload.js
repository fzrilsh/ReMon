const multer = require('multer');
const path = require('path');
const env = require('../config/env');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const subfolder = file.fieldname === 'proof' ? 'proofs' : 'receipts';
    // Resolve ke absolute path agar tidak bergantung pada CWD saat server dijalankan
    const destPath = path.isAbsolute(env.uploadDir)
      ? path.join(env.uploadDir, subfolder)
      : path.join(process.cwd(), env.uploadDir, subfolder);
    cb(null, destPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPEG, PNG, WEBP) yang diperbolehkan'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
