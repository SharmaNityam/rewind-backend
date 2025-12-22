#!/bin/bash

# Database Permission Fix Script
# This script fixes the Prisma P1010 permission issue

set -e

echo "🔧 Fixing database permissions..."

# Wait for PostgreSQL
sleep 3

# Grant all necessary permissions
docker exec rewind-postgres psql -U rewind_user -d rewind_db << EOF
-- Make user owner
ALTER DATABASE rewind_db OWNER TO rewind_user;
ALTER SCHEMA public OWNER TO rewind_user;

-- Grant all permissions
GRANT ALL ON SCHEMA public TO rewind_user;
GRANT ALL PRIVILEGES ON DATABASE rewind_db TO rewind_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rewind_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rewind_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO rewind_user;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rewind_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rewind_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO rewind_user;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO rewind_user;
EOF

echo "✅ Permissions fixed!"
echo ""
echo "Now try running: npx prisma db push"

