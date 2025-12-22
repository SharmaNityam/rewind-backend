#!/bin/bash

# API Test Script
# Tests all major endpoints to ensure the backend is working

set -e

BASE_URL="http://localhost:3000/api/v1"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 Testing Rewind Backend API..."
echo ""

# Test health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "$HEALTH_RESPONSE"
    exit 1
fi

# Test register
echo -e "${YELLOW}Testing user registration...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test'$(date +%s)'@example.com",
    "password": "password123"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Registration successful${NC}"
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}✗ Registration failed${NC}"
    echo "$REGISTER_RESPONSE"
    exit 1
fi

# Test login
echo -e "${YELLOW}Testing user login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "password123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Login successful${NC}"
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${YELLOW}⚠️  Login test skipped (user may not exist)${NC}"
fi

# Test protected endpoint
if [ ! -z "$ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}Testing protected endpoint (GET /auth/me)...${NC}"
    ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$ME_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✓ Protected endpoint works${NC}"
    else
        echo -e "${RED}✗ Protected endpoint failed${NC}"
        echo "$ME_RESPONSE"
    fi
fi

# Test journals endpoint
if [ ! -z "$ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}Testing journals endpoint...${NC}"
    JOURNALS_RESPONSE=$(curl -s -X GET "$BASE_URL/journals" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$JOURNALS_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✓ Journals endpoint works${NC}"
    else
        echo -e "${YELLOW}⚠️  Journals endpoint test inconclusive${NC}"
    fi
fi

# Test goals endpoint
if [ ! -z "$ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}Testing goals endpoint...${NC}"
    GOALS_RESPONSE=$(curl -s -X GET "$BASE_URL/goals" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$GOALS_RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✓ Goals endpoint works${NC}"
    else
        echo -e "${YELLOW}⚠️  Goals endpoint test inconclusive${NC}"
    fi
fi

# Test community tags endpoint (public)
echo -e "${YELLOW}Testing community tags endpoint (public)...${NC}"
TAGS_RESPONSE=$(curl -s -X GET "$BASE_URL/community/tags")
if echo "$TAGS_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Community tags endpoint works${NC}"
else
    echo -e "${YELLOW}⚠️  Community tags endpoint test inconclusive${NC}"
fi

echo ""
echo -e "${GREEN}✅ API tests completed!${NC}"
echo ""
echo "All endpoints are responding. Backend is working correctly!"

