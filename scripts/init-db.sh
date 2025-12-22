#!/bin/bash

# Database Initialization Script
# This script properly sets up the database with all required permissions

set -e

echo "🔧 Initializing database..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
sleep 5

# Create database and grant permissions using the default postgres user approach
# Since we're using POSTGRES_USER in docker-compose, the user should already exist
# But we need to ensure the database is properly set up

docker exec rewind-postgres psql -U rewind_user -d rewind_db -c "
-- Ensure we're the owner
ALTER DATABASE rewind_db OWNER TO rewind_user;
ALTER SCHEMA public OWNER TO rewind_user;

-- Grant all necessary permissions
GRANT ALL ON SCHEMA public TO rewind_user;
GRANT ALL PRIVILEGES ON DATABASE rewind_db TO rewind_user;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rewind_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rewind_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO rewind_user;
" 2>&1 || echo "Note: Some commands may have already been executed"

echo "✅ Database initialization complete"

