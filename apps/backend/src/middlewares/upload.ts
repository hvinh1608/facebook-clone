import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '../utils/errors';

// Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime', // MOV
]);

const allowedExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.heic',
  '.heif',
  '.avif',
  '.mp4',
  '.webm',
  '.ogg',
  '.mov',
]);

const fileFilter = (req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.has(file.mimetype) || allowedExtensions.has(ext)) {
    cb(null, true);
    return;
  }

  cb(
    new BadRequestError(
      'Chỉ hỗ trợ ảnh (jpg, png, gif, webp, heic) và video (mp4, webm, mov).'
    ) as any
  );
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // Max size 100MB for video upload
  },
});

export const handleUpload =
  (field: string) => (req: any, res: any, next: any) => {
    upload.single(field)(req, res, (err: any) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'File quá lớn. Tối đa 100MB.'
            : err.message;
        return next(new BadRequestError(message));
      }

      return next(err);
    });
  };
