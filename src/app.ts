import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import journalRoutes from './routes/journal.routes';
import goalRoutes from './routes/goal.routes';
import careCornerRoutes from './routes/careCorner.routes';
import communityRoutes from './routes/community.routes';
import notificationRoutes from './routes/notification.routes';
import homepetsRoutes from './routes/homepets.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { generalRateLimiter } from './middleware/rateLimiter';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (local storage only)
if (process.env.USE_S3_STORAGE !== 'true') {
  const path = require('path');
  const uploadPath = process.env.UPLOAD_PATH || './uploads';
  app.use('/uploads', express.static(path.resolve(uploadPath)));
}

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(generalRateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
const apiVersion = process.env.API_VERSION || 'v1';
app.use(`/api/${apiVersion}/auth`, authRoutes);
app.use(`/api/${apiVersion}/users`, userRoutes);
app.use(`/api/${apiVersion}/journals`, journalRoutes);
app.use(`/api/${apiVersion}/goals`, goalRoutes);
app.use(`/api/${apiVersion}/care-corner`, careCornerRoutes);
app.use(`/api/${apiVersion}/community`, communityRoutes);
app.use(`/api/${apiVersion}/notifications`, notificationRoutes);
app.use(`/api/${apiVersion}/homepets`, homepetsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;

