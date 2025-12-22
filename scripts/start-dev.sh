#!/bin/bash

# Development Server Startup Script

set -e

echo "🚀 Starting Rewind Backend Development Server..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Running setup first..."
    ./scripts/setup.sh
fi

# Check if Docker services are running
if ! docker ps | grep -q rewind-postgres; then
    echo "🐳 Starting Docker services..."
    docker-compose up -d postgres redis
    sleep 5
fi

# Check if Prisma Client is generated
if [ ! -d "node_modules/.prisma" ]; then
    echo "🔧 Generating Prisma Client..."
    npm run prisma:generate
fi

echo "✅ Starting development server..."
echo "📖 API Documentation: http://localhost:3000/api-docs"
echo "🏥 Health Check: http://localhost:3000/health"
echo ""

npm run dev

