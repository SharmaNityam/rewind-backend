# Rewind Backend API

Backend API for the Rewind iOS mental health and wellness application.

## Features

- **Authentication**: JWT-based authentication with refresh tokens
- **User Management**: Profile, onboarding, avatar upload
- **Journaling**: Text and voice journaling with media support
- **Goals**: Personal health and wellness goal tracking
- **Care Corner**: Breathing exercises, meditation sessions, daily challenges
- **Community**: Posts, comments, likes with anonymous posting support
- **Notifications**: User notifications system
- **File Storage**: Local and AWS S3 support for media files

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Local filesystem or AWS S3
- **Logging**: Winston
- **Validation**: Express Validator

## Prerequisites

- Node.js 20+ 
- PostgreSQL 15+
- Docker and Docker Compose (optional, for containerized setup)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the following variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `REFRESH_TOKEN_SECRET`: Secret key for refresh tokens
- `AWS_*`: AWS credentials (if using S3 storage)

### 3. Database Setup

Generate Prisma Client:
```bash
npm run prisma:generate
```

Run migrations:
```bash
npm run prisma:migrate
```

Seed database:
```bash
npm run prisma:seed
```

### 4. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Docker Setup

### Using Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Redis on port 6379
- Backend API on port 3000

### Manual Docker Build

```bash
docker build -f docker/Dockerfile -t rewind-backend .
docker run -p 3000:3000 rewind-backend
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `POST /api/v1/users/profile/avatar` - Upload profile image
- `POST /api/v1/users/onboarding` - Save onboarding data
- `GET /api/v1/users/onboarding-status` - Get onboarding status

### Journals
- `GET /api/v1/journals` - List journals
- `GET /api/v1/journals/:id` - Get journal details
- `POST /api/v1/journals` - Create journal
- `PUT /api/v1/journals/:id` - Update journal
- `DELETE /api/v1/journals/:id` - Delete journal
- `POST /api/v1/journals/:id/media` - Upload media to journal
- `GET /api/v1/journals/timeline` - Get timeline view
- `POST /api/v1/journals/voice/transcribe` - Transcribe voice recording

### Goals
- `GET /api/v1/goals` - List goals
- `GET /api/v1/goals/:id` - Get goal details
- `POST /api/v1/goals` - Create goal
- `PUT /api/v1/goals/:id` - Update goal
- `DELETE /api/v1/goals/:id` - Delete goal
- `PUT /api/v1/goals/:id/progress` - Update goal progress

### Care Corner
- `GET /api/v1/care-corner/challenges` - Get daily challenges
- `POST /api/v1/care-corner/challenges/:id/complete` - Complete challenge
- `GET /api/v1/care-corner/breathing` - Get breathing history
- `POST /api/v1/care-corner/breathing` - Record breathing exercise
- `GET /api/v1/care-corner/meditation` - Get meditation history
- `POST /api/v1/care-corner/meditation` - Record meditation session
- `GET /api/v1/care-corner/activities` - Get all activities
- `GET /api/v1/care-corner/stats` - Get wellness stats

### Community
- `GET /api/v1/community/posts` - List posts
- `GET /api/v1/community/posts/:id` - Get post details
- `POST /api/v1/community/posts` - Create post
- `PUT /api/v1/community/posts/:id` - Update post
- `DELETE /api/v1/community/posts/:id` - Delete post
- `POST /api/v1/community/posts/:id/like` - Like/unlike post
- `GET /api/v1/community/posts/:id/comments` - Get post comments
- `POST /api/v1/community/posts/:id/comments` - Add comment
- `PUT /api/v1/community/comments/:id` - Update comment
- `DELETE /api/v1/community/comments/:id` - Delete comment
- `GET /api/v1/community/tags` - Get available tags
- `GET /api/v1/community/users/:id/posts` - Get user's posts

### Notifications
- `GET /api/v1/notifications` - Get notifications
- `GET /api/v1/notifications/unread` - Get unread count
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification

### HomePets
- `GET /api/v1/homepets/user-pet` - Get user's pet
- `PUT /api/v1/homepets/user-pet` - Update pet

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models (Prisma)
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seed script
├── docker/              # Dockerfiles
├── tests/               # Test files
└── package.json
```

## Development

### Run in Development Mode

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Database Management

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Seed database
npm run prisma:seed
```

## Environment Variables

See `.env.example` for all available environment variables.

## License

ISC

