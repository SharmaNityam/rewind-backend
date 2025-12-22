# Quick Start - Run Backend

## 🚀 Quick Commands

### 1. Start Docker Services (Database & Redis)
```bash
cd backend
docker-compose up -d postgres redis
```

### 2. Install Dependencies (First time only)
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

**That's it!** Server will run on `http://localhost:3000`

---

## 📋 Complete Setup (First Time)

### Step 1: Navigate to Backend
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Docker Services
```bash
docker-compose up -d postgres redis
```

Wait ~10 seconds for services to be ready.

### Step 4: Verify Database
```bash
docker exec rewind-postgres psql -U rewind_user -d rewind_db -c "SELECT 1;"
```

### Step 5: Start Server
```bash
npm run dev
```

### Step 6: Test Health Check
```bash
curl http://localhost:3000/health
```

---

## 🔧 Common Commands

### Start Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Run Production Build
```bash
npm start
```

### Stop Docker Services
```bash
docker-compose down
```

### Stop Docker Services (with volumes)
```bash
docker-compose down -v
```

### View Docker Logs
```bash
docker-compose logs -f
```

### Restart Docker Services
```bash
docker-compose restart
```

### Check Server Status
```bash
curl http://localhost:3000/health
```

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Database Connection Error
```bash
# Restart Docker services
docker-compose restart postgres

# Check if database is running
docker ps | grep postgres
```

### Docker Services Not Starting
```bash
# Check Docker status
docker ps

# Start services
docker-compose up -d postgres redis

# View logs
docker-compose logs postgres
```

---

## 📊 Verify Everything is Running

### Check Docker Services
```bash
docker-compose ps
```

Should show:
- `rewind-postgres` - Up (healthy)
- `rewind-redis` - Up (healthy)

### Check Server
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"..."}
```

### Check API Documentation
Open in browser: `http://localhost:3000/api-docs`

---

## 🎯 Quick Test

After starting the server, test registration:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

---

## 📝 Environment Variables

Create `.env` file (optional, defaults work for local):

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://rewind_user:rewind_password@localhost:5432/rewind_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key
```

---

## ✅ Success Indicators

- ✅ Docker services: `docker-compose ps` shows both services as "Up"
- ✅ Server: `curl http://localhost:3000/health` returns `{"status":"ok"}`
- ✅ API Docs: Browser shows Swagger UI at `http://localhost:3000/api-docs`
- ✅ No errors in terminal

---

**Ready to test!** 🚀
