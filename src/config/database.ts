import { initializeDatabase, AppDataSource } from './typeorm';
import { logger } from '../utils/logger';

// Initialize TypeORM connection
let isInitialized = false;

export const connectDatabase = async () => {
  if (!isInitialized) {
    try {
      await initializeDatabase();
      isInitialized = true;
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database', { 
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        } : error
      });
      throw error;
    }
  }
  return AppDataSource;
};

// Graceful shutdown
process.on('beforeExit', async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('Database connection closed');
  }
});

// Export the data source for direct use
export default AppDataSource;
