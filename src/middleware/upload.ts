import multer from 'multer';
import { Request } from 'express';
import { AppError } from './errorHandler';
import { FileStorageService } from '../services/fileStorage.service';

// Configure multer memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedImageTypes = (
    process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,heic'
  ).split(',');
  const allowedAudioTypes = (
    process.env.ALLOWED_AUDIO_TYPES || 'm4a,wav'
  ).split(',');

  const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
  const isImage = allowedImageTypes.includes(fileExtension || '');
  const isAudio = allowedAudioTypes.includes(fileExtension || '');

  if (isImage || isAudio) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `File type not allowed. Allowed types: ${allowedImageTypes.join(', ')}, ${allowedAudioTypes.join(', ')}`,
        400,
        'INVALID_FILE_TYPE'
      )
    );
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  },
});

// Single file upload
export const uploadSingle = (fieldName: string) => {
  return upload.single(fieldName);
};

// Multiple files upload
export const uploadMultiple = (fieldName: string, maxCount: number = 10) => {
  return upload.array(fieldName, maxCount);
};

// Multiple fields upload
export const uploadFields = (fields: multer.Field[]) => {
  return upload.fields(fields);
};

