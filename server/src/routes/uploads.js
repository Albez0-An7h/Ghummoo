const path = require('path');
const crypto = require('crypto');
const router = require('express').Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' };

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (EXT[file.mimetype]) return cb(null, true);
    const err = new Error('Only JPG, PNG, WebP or AVIF images are allowed');
    err.statusCode = 400;
    return cb(err);
  },
});

router.post('/', verifyToken, requireRole('operator', 'admin'), upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Please choose an image' });
  return res.status(201).json({ success: true, data: { url: `/uploads/${req.file.filename}` } });
});

module.exports = router;
