# Quick Start Guide

## For Faculty Reviewers

### 1. Read the Documentation
Start with these files in order:
1. **BACKEND_WALKTHROUGH.md** - Complete system overview
2. **PROGRESS_REPORT.md** - Progress summary
3. **PRESENTATION_GUIDE.md** - If presenting

### 2. View the API Documentation
- Start the server: `npm run dev`
- Open: http://localhost:3000/api-docs
- Interactive Swagger UI with all endpoints

### 3. Test the API
```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## For Developers

### Setup
```bash
cd backend
npm install
docker-compose up -d postgres redis
./scripts/setup-database.sh
npm run dev
```

### Access Points
- API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs
- Health: http://localhost:3000/health
