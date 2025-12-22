-- Database initialization script
-- This runs automatically when PostgreSQL container starts

-- Grant all privileges to rewind_user
GRANT ALL PRIVILEGES ON DATABASE rewind_db TO rewind_user;

-- Connect to rewind_db and set up schema
\c rewind_db

-- Make rewind_user the owner
ALTER DATABASE rewind_db OWNER TO rewind_user;
ALTER SCHEMA public OWNER TO rewind_user;

-- Grant all permissions on schema
GRANT ALL ON SCHEMA public TO rewind_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rewind_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rewind_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO rewind_user;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rewind_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rewind_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO rewind_user;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO rewind_user;

