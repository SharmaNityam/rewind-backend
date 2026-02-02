import 'reflect-metadata';
import app from './app';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';

const PORT = process.env.PORT || 3000;

// Initialize database connection before starting server
let server: any;

connectDatabase()
  .then(() => {
    server = app.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Server listening on http://0.0.0.0:${PORT}`);
    });

    // Graceful shutdown logic moved inside or server variable hoisted
  })
  .catch((error) => {
    logger.error('Failed to start server', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error
    });
    process.exit(1);
  });

// Graceful shutdown
const shutdown = () => {
  logger.info('Signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

