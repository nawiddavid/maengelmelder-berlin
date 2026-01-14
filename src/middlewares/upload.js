import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Multer Konfiguration für Foto-Uploads
 */

// Speicherort und Dateiname
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

// Dateifilter: Nur Bilder erlauben
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Nur JPEG, PNG und WebP Bilder sind erlaubt'), false);
  }
};

// Multer-Instanz
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max (vor Komprimierung)
    files: 3 // Max 3 Dateien
  }
});

/**
 * Middleware für einzelnes Foto (Pflichtfeld)
 */
export const uploadSinglePhoto = upload.single('photo');

/**
 * Middleware für mehrere Fotos
 */
export const uploadMultiplePhotos = upload.array('photos', 3);

/**
 * Middleware für gemischten Upload (1 Pflichtfoto + optionale weitere)
 */
export const uploadPhotos = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'photos', maxCount: 2 }
]);

/**
 * Error-Handler für Multer-Fehler
 */
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'file_too_large',
        message: 'Datei ist zu groß. Maximum: 5MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'too_many_files',
        message: 'Zu viele Dateien. Maximum: 3'
      });
    }
    return res.status(400).json({
      error: 'upload_error',
      message: err.message
    });
  }
  
  if (err.message && err.message.includes('Nur JPEG')) {
    return res.status(400).json({
      error: 'invalid_file_type',
      message: err.message
    });
  }
  
  next(err);
}

export default upload;
