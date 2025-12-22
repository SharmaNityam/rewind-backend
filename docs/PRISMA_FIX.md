# Prisma P1010 Fix

## Problem
Prisma Client throws `P1010: User was denied access on the database` error when trying to connect to PostgreSQL.

## Root Cause
Prisma tries to query PostgreSQL system catalogs (`pg_database`, `pg_namespace`, etc.) during connection initialization to validate the connection. Even with proper table permissions, Prisma needs access to these system tables.

## Solution Applied

### 1. Database Permissions
Granted comprehensive permissions to `rewind_user`:

```sql
-- Database-level permissions
GRANT CONNECT ON DATABASE rewind_db TO rewind_user;
GRANT ALL PRIVILEGES ON DATABASE rewind_db TO rewind_user;

-- Schema-level permissions
GRANT USAGE ON SCHEMA public TO rewind_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rewind_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rewind_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO rewind_user;

-- System catalog access (CRITICAL for Prisma)
GRANT SELECT ON pg_database TO rewind_user;
GRANT SELECT ON pg_namespace TO rewind_user;
GRANT SELECT ON pg_user TO rewind_user;
GRANT SELECT ON pg_roles TO rewind_user;
GRANT SELECT ON information_schema.schemata TO rewind_user;
GRANT SELECT ON information_schema.tables TO rewind_user;

-- Default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rewind_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rewind_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO rewind_user;
```

### 2. Connection String
- Removed any `?schema=` parameters from `DATABASE_URL`
- Prisma automatically uses the `public` schema
- Connection string format: `postgresql://user:password@host:port/database`

### 3. Prisma Client Configuration
- Removed explicit `$connect()` call during initialization
- Prisma uses lazy connection (connects on first query)
- This avoids validation errors during startup

### 4. User Privileges
Made `rewind_user` a superuser (for development):
```sql
ALTER USER rewind_user WITH SUPERUSER;
```

## Verification

Test the fix:
```bash
# Test Prisma connection
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.findMany().then(() => console.log('✅ Works')).catch(e => console.log('❌ Error:', e.message));"

# Test API endpoint
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password123"}'
```

## Alternative Solutions (if above doesn't work)

### Option 1: Use PostgreSQL 13
```yaml
# docker-compose.yml
postgres:
  image: postgres:13-alpine
```

### Option 2: Use Connection Pooler
Add `?pgbouncer=true` to connection string (if using PgBouncer)

### Option 3: Use Direct Connection
Add `?directUrl=postgresql://...` for direct connection bypassing pooler

### Option 4: Update Prisma
```bash
npm install prisma@latest @prisma/client@latest
npm run prisma:generate
```

## Status
✅ **FIXED** - Database operations now work correctly

