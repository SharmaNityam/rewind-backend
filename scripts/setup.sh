#!/bin/bash

# Rewind Backend Setup Script
# This script sets up the backend environment

set -e

echo "🚀 Starting Rewind Backend Setup..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please update .env with your configuration${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed. Please install Node.js 20+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}✗ Node.js version 20+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) is installed${NC}"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not running. Starting Docker services manually...${NC}"
else
    echo -e "${GREEN}✓ Docker is running${NC}"
fi

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Start Docker services
echo -e "${YELLOW}🐳 Starting Docker services (PostgreSQL, Redis)...${NC}"
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 5

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

# Generate Prisma Client
echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
npm run prisma:generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"

# Run migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
npm run prisma:migrate -- --name init || echo -e "${YELLOW}⚠️  Migration may have already been run${NC}"
echo -e "${GREEN}✓ Migrations completed${NC}"

# Seed database
echo -e "${YELLOW}🌱 Seeding database...${NC}"
npm run prisma:seed || echo -e "${YELLOW}⚠️  Seed may have already been run${NC}"
echo -e "${GREEN}✓ Database seeded${NC}"

# Create uploads directory
if [ ! -d "uploads" ]; then
    echo -e "${YELLOW}📁 Creating uploads directory...${NC}"
    mkdir -p uploads/journals
    echo -e "${GREEN}✓ Uploads directory created${NC}"
else
    echo -e "${GREEN}✓ Uploads directory exists${NC}"
fi

# Create logs directory
if [ ! -d "logs" ]; then
    echo -e "${YELLOW}📁 Creating logs directory...${NC}"
    mkdir -p logs
    echo -e "${GREEN}✓ Logs directory created${NC}"
else
    echo -e "${GREEN}✓ Logs directory exists${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review and update .env file if needed"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Visit http://localhost:3000/api-docs for API documentation"
echo ""

