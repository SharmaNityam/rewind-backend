# Backend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Docker Services** (PostgreSQL & Redis)
   ```bash
   docker-compose up -d
   ```

4. **Set Up Database**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`
API Documentation: `http://localhost:3000/api-docs`

## Environment Variables

Key variables to configure in `.env`:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens (use a strong random string)
- `REFRESH_TOKEN_SECRET`: Secret for refresh tokens
- `USE_S3_STORAGE`: Set to `true` to use AWS S3, `false` for local storage
- `AWS_*`: AWS credentials (if using S3)

## Testing the API

### Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Access Protected Endpoint
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Management

- **Prisma Studio**: `npm run prisma:studio` - Visual database browser
- **Create Migration**: `npm run prisma:migrate`
- **Reset Database**: `npx prisma migrate reset`

## Project Structure

- `src/controllers/` - Request handlers
- `src/services/` - Business logic
- `src/routes/` - API route definitions
- `src/middleware/` - Express middleware (auth, validation, etc.)
- `src/config/` - Configuration files
- `prisma/` - Database schema and migrations

## Next Steps

1. Configure production environment variables
2. Set up AWS S3 for file storage (if needed)
3. Configure email/SMS services for OTP
4. Set up monitoring and logging
5. Deploy to production server

