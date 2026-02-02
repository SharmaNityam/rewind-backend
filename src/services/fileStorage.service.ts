import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';
import { s3Client, awsConfig } from '../config/aws';
import { logger } from '../utils/logger';

export class FileStorageService {
  // Get upload directory
  static getUploadDir(): string {
    return process.env.UPLOAD_PATH || './uploads';
  }

  // Ensure upload directory exists
  static async ensureUploadDir(): Promise<void> {
    const uploadDir = this.getUploadDir();
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
  }

  // Save file locally
  static async saveFileLocally(
    file: Express.Multer.File,
    subfolder: string = ''
  ): Promise<string> {
    await this.ensureUploadDir();

    const uploadDir = this.getUploadDir();
    const folderPath = subfolder
      ? path.join(uploadDir, subfolder)
      : uploadDir;

    await fs.mkdir(folderPath, { recursive: true });

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
    const filePath = path.join(folderPath, fileName);

    await fs.writeFile(filePath, file.buffer);

    return path.join(subfolder, fileName).replace(/\\/g, '/');
  }

  // Upload to S3
  static async uploadToS3(
    file: Express.Multer.File,
    key: string
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: awsConfig.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    return key;
  }

  // Get file URL (local or S3)
  static async getFileUrl(filePath: string): Promise<string> {
    if (awsConfig.useS3) {
      // Return S3 URL
      return `https://${awsConfig.bucket}.s3.${awsConfig.region}.amazonaws.com/${filePath}`;
    } else {
      // Return local URL (relative path for serving)
      return `/uploads/${filePath}`;
    }
  }

  // Get signed URL for S3 (for private files)
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!awsConfig.useS3) {
      throw new Error('S3 is not enabled');
    }

    const command = new GetObjectCommand({
      Bucket: awsConfig.bucket,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }

  // Save file (local or S3)
  static async saveFile(
    file: Express.Multer.File,
    subfolder: string = ''
  ): Promise<string> {
    if (awsConfig.useS3) {
      const key = subfolder
        ? `${subfolder}/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`
        : `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;

      await this.uploadToS3(file, key);
      logger.info(`File uploaded to S3: ${key}`);
      return key;
    } else {
      const filePath = await this.saveFileLocally(file, subfolder);
      logger.info(`File saved locally: ${filePath}`);
      return filePath;
    }
  }

  // Delete file
  static async deleteFile(filePath: string): Promise<void> {
    if (awsConfig.useS3) {
      // TODO: Implement S3 delete
      logger.warn('S3 delete not implemented yet');
    } else {
      const fullPath = path.join(this.getUploadDir(), filePath);
      try {
        await fs.unlink(fullPath);
        logger.info(`File deleted: ${fullPath}`);
      } catch (error) {
        logger.error(`Failed to delete file: ${fullPath}`, {
          filePath: fullPath,
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          } : error
        });
      }
    }
  }
}

