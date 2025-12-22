#!/bin/bash

# Complete Database Setup Script
# This script sets up the database from scratch

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🗄️  Setting up Rewind Database...${NC}"

# Start Docker services
echo -e "${YELLOW}🐳 Starting Docker services...${NC}"
cd "$(dirname "$0")/.."
docker-compose up -d postgres redis

# Wait for PostgreSQL
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 15

MAX_RETRIES=30
RETRY_COUNT=0
while ! docker exec rewind-postgres pg_isready -U rewind_user &> /dev/null; do
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo -e "${RED}✗ PostgreSQL failed to start${NC}"
        exit 1
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 2
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Make user superuser (fixes Prisma permission issues)
echo -e "${YELLOW}🔧 Configuring database permissions...${NC}"
docker exec rewind-postgres psql -U rewind_user -d postgres -c "ALTER USER rewind_user WITH SUPERUSER;" 2>&1 || true

# Grant all permissions
docker exec rewind-postgres psql -U rewind_user -d rewind_db << 'EOF'
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

-- Grant system catalog access (for Prisma)
GRANT SELECT ON pg_database TO rewind_user;
GRANT SELECT ON pg_namespace TO rewind_user;
GRANT SELECT ON pg_user TO rewind_user;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO rewind_user;
GRANT SELECT ON ALL TABLES IN SCHEMA pg_catalog TO rewind_user;
EOF

echo -e "${GREEN}✓ Permissions configured${NC}"

# Generate Prisma Client
echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
npm run prisma:generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"

# Seed database (if tables exist)
echo -e "${YELLOW}🌱 Seeding database...${NC}"
docker exec -i rewind-postgres psql -U rewind_user -d rewind_db << 'EOF'
-- Seed daily challenges
INSERT INTO daily_challenges (id, challenge_text, challenge_date, created_at)
VALUES 
    (uuid_generate_v4(), 'Put your phone face-down for 10 minutes', CURRENT_DATE, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Write down three things you are grateful for today', CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Take 5 deep breaths and focus on the present moment', CURRENT_DATE + INTERVAL '2 days', CURRENT_TIMESTAMP)
ON CONFLICT (challenge_date) DO NOTHING;
EOF

echo -e "${GREEN}✓ Database seeded${NC}"

# Verify setup
echo -e "${YELLOW}✅ Verifying database setup...${NC}"
TABLE_COUNT=$(docker exec rewind-postgres psql -U rewind_user -d rewind_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
CHALLENGE_COUNT=$(docker exec rewind-postgres psql -U rewind_user -d rewind_db -t -c "SELECT COUNT(*) FROM daily_challenges;" | tr -d ' ')

echo -e "${GREEN}✓ Database setup complete!${NC}"
echo -e "  - Tables created: ${TABLE_COUNT}"
echo -e "  - Challenges seeded: ${CHALLENGE_COUNT}"
echo ""
echo -e "${GREEN}✅ Database is ready to use!${NC}"

