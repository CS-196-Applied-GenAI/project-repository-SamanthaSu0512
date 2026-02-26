const path = require('path');
const multer = require('multer');
const { randomUUID } = require('crypto');

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || path.extname(mimeToExt(file.mimetype));
    cb(null, `${randomUUID()}${ext}`);
  },
});

function mimeToExt(mime) {
  const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' };
  return map[mime] || '';
}

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'), false);
  }
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
}).single('profilePicture');

module.exports = { uploadAvatar, UPLOAD_DIR };
