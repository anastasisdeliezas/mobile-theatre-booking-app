import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

function imageFileFilter(_req, file, cb) {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(new Error('Μη έγκυρος τύπος εικόνας. Επιτρέπονται JPG, PNG, WEBP.'));
    return;
  }

  cb(null, true);
}

export const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: imageFileFilter
});

export function uploadImageForUser(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Δεν ανέβηκε εικόνα' });
  }

  return res.status(201).json({
    url: `/uploads/${req.file.filename}`
  });
}