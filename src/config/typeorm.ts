import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';
import {
  User,
  Journal,
  Goal,
  BreathingExercise,
  MeditationSession,
  DailyChallenge,
  UserChallengeCompletion,
  CommunityPost,
  Comment,
  PostLike,
  Notification,
  RefreshToken,
  UserPenguinState,
  UserPenguinMemory,
} from '../entities';

dotenv.config();

// Parse DATABASE_URL if provided, otherwise use individual env vars
let dbConfig: any = {};
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    dbConfig = {
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading /
    };
  } catch (e) {
    // Fallback to individual env vars if URL parsing fails
    dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433'),
      username: process.env.DB_USER || 'rewind_user',
      password: process.env.DB_PASSWORD || 'rewind_password',
      database: process.env.DB_NAME || 'rewind_db',
    };
  }
} else {
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    username: process.env.DB_USER || 'rewind_user',
    password: process.env.DB_PASSWORD || 'rewind_password',
    database: process.env.DB_NAME || 'rewind_db',
  };
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...dbConfig,
  entities: [
    User,
    Journal,
    Goal,
    BreathingExercise,
    MeditationSession,
    DailyChallenge,
    UserChallengeCompletion,
    CommunityPost,
    Comment,
    PostLike,
    Notification,
    RefreshToken,
    UserPenguinState,
    UserPenguinMemory,
  ],
  synchronize: true, // Auto-sync enabled for verify/dev
  logging: process.env.NODE_ENV === 'development',
  migrations: [path.join(__dirname, '../migrations/**/*{.ts,.js}')],
});

// Initialize connection
export const initializeDatabase = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected successfully');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

export default AppDataSource;

