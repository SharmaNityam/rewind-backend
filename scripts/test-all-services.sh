#!/bin/bash

# Comprehensive test script for all TypeORM services
# Tests all endpoints to ensure migration is successful

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing All TypeORM Services"
echo "================================"
echo ""

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local token=$5
    
    echo -n "Testing $name... "
    
    if [ -n "$token" ]; then
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $token" "$BASE_URL$url")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "$data" "$BASE_URL$url")
        fi
    else
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "\n%{http_code}" "$BASE_URL$url")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$url")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
        echo "   Response: $body" | head -c 100
        echo ""
        ((FAILED++))
        return 1
    fi
}

# Check if server is running
echo "Checking server health..."
if ! curl -s "$BASE_URL/health" > /dev/null; then
    echo -e "${RED}❌ Server is not running!${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Generate unique email
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"
TEST_PASSWORD="test123456"
TEST_NAME="Test User"

echo "📝 Test User: $TEST_EMAIL"
echo ""

# ============================================
# AUTHENTICATION TESTS
# ============================================
echo "🔐 Testing Authentication Services"
echo "-----------------------------------"

test_endpoint "Health Check" "GET" "/health" "" ""
test_endpoint "User Registration" "POST" "/api/v1/auth/register" "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" ""

# Extract token from registration
REGISTER_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" "$BASE_URL/api/v1/auth/register")
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to get access token${NC}"
    echo "Registration response: $REGISTER_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Got access token${NC}"
echo ""

test_endpoint "Get Current User" "GET" "/api/v1/auth/me" "" "$TOKEN"

# Test login with same credentials
LOGIN_EMAIL="login${TIMESTAMP}@example.com"
test_endpoint "User Login" "POST" "/api/v1/auth/login" "{\"email\":\"$LOGIN_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" ""

# Register another user for login test
curl -s -X POST -H "Content-Type: application/json" -d "{\"name\":\"Login Test\",\"email\":\"$LOGIN_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" "$BASE_URL/api/v1/auth/register" > /dev/null
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"email\":\"$LOGIN_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" "$BASE_URL/api/v1/auth/login")
LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$LOGIN_TOKEN" ]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Login failed${NC}"
    ((FAILED++))
fi

echo ""

# ============================================
# USER SERVICE TESTS
# ============================================
echo "👤 Testing User Services"
echo "------------------------"

test_endpoint "Get User Profile" "GET" "/api/v1/users/profile" "" "$TOKEN"
test_endpoint "Update User Profile" "PUT" "/api/v1/users/profile" "{\"name\":\"Updated Name\",\"location\":\"Test Location\"}" "$TOKEN"
test_endpoint "Get Onboarding Status" "GET" "/api/v1/users/onboarding" "" "$TOKEN"
test_endpoint "Complete Onboarding" "POST" "/api/v1/users/onboarding" "{\"healthGoal\":\"Reduce stress\",\"gender\":\"male\",\"age\":25,\"seekingProfessionalHelp\":false}" "$TOKEN"

echo ""

# ============================================
# JOURNAL SERVICE TESTS
# ============================================
echo "📔 Testing Journal Services"
echo "---------------------------"

# Create a journal
JOURNAL_DATA="{\"title\":\"Test Journal Entry\",\"content\":\"This is a test journal entry\",\"entryType\":\"text\",\"moodTags\":[\"happy\",\"grateful\"]}"
JOURNAL_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$JOURNAL_DATA" "$BASE_URL/api/v1/journals")
JOURNAL_ID=$(echo "$JOURNAL_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$JOURNAL_ID" ]; then
    echo -e "${GREEN}✅ Created journal: $JOURNAL_ID${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Failed to create journal${NC}"
    ((FAILED++))
fi

test_endpoint "List Journals" "GET" "/api/v1/journals" "" "$TOKEN"
test_endpoint "Get Journal by ID" "GET" "/api/v1/journals/$JOURNAL_ID" "" "$TOKEN"
test_endpoint "Update Journal" "PUT" "/api/v1/journals/$JOURNAL_ID" "{\"title\":\"Updated Journal Title\",\"content\":\"Updated content\"}" "$TOKEN"

echo ""

# ============================================
# GOAL SERVICE TESTS
# ============================================
echo "🎯 Testing Goal Services"
echo "------------------------"

# Create a goal
GOAL_DATA="{\"title\":\"Test Goal\",\"description\":\"This is a test goal\",\"category\":\"health\",\"status\":\"active\",\"progress\":0}"
GOAL_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$GOAL_DATA" "$BASE_URL/api/v1/goals")
GOAL_ID=$(echo "$GOAL_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$GOAL_ID" ]; then
    echo -e "${GREEN}✅ Created goal: $GOAL_ID${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Failed to create goal${NC}"
    ((FAILED++))
fi

test_endpoint "List Goals" "GET" "/api/v1/goals" "" "$TOKEN"
test_endpoint "Get Goal by ID" "GET" "/api/v1/goals/$GOAL_ID" "" "$TOKEN"
test_endpoint "Update Goal" "PUT" "/api/v1/goals/$GOAL_ID" "{\"title\":\"Updated Goal\",\"progress\":50}" "$TOKEN"
test_endpoint "Update Goal Progress" "PUT" "/api/v1/goals/$GOAL_ID/progress" "{\"progress\":75}" "$TOKEN"

echo ""

# ============================================
# CARE CORNER SERVICE TESTS
# ============================================
echo "🧘 Testing Care Corner Services"
echo "--------------------------------"

test_endpoint "Get Daily Challenges" "GET" "/api/v1/care-corner/challenges" "" "$TOKEN"

# Get challenge ID
CHALLENGE_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/care-corner/challenges")
CHALLENGE_ID=$(echo "$CHALLENGE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)

if [ -n "$CHALLENGE_ID" ]; then
    test_endpoint "Complete Challenge" "POST" "/api/v1/care-corner/challenges/$CHALLENGE_ID/complete" "" "$TOKEN"
fi

test_endpoint "Start Breathing Exercise" "POST" "/api/v1/care-corner/breathing" "{\"durationSeconds\":60}" "$TOKEN"
test_endpoint "Start Meditation Session" "POST" "/api/v1/care-corner/meditation" "{\"durationSeconds\":300,\"soundName\":\"ocean\"}" "$TOKEN"
test_endpoint "Get Activity History" "GET" "/api/v1/care-corner/history" "" "$TOKEN"

echo ""

# ============================================
# COMMUNITY SERVICE TESTS
# ============================================
echo "👥 Testing Community Services"
echo "-----------------------------"

# Create a post
POST_DATA="{\"content\":\"This is a test community post\",\"isAnonymous\":false,\"tags\":[\"test\",\"community\"]}"
POST_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$POST_DATA" "$BASE_URL/api/v1/community/posts")
POST_ID=$(echo "$POST_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$POST_ID" ]; then
    echo -e "${GREEN}✅ Created post: $POST_ID${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Failed to create post${NC}"
    ((FAILED++))
fi

test_endpoint "List Posts" "GET" "/api/v1/community/posts" "" "$TOKEN"
test_endpoint "Get Post by ID" "GET" "/api/v1/community/posts/$POST_ID" "" "$TOKEN"
test_endpoint "Like Post" "POST" "/api/v1/community/posts/$POST_ID/like" "" "$TOKEN"

# Add a comment
COMMENT_DATA="{\"commentText\":\"This is a test comment\"}"
COMMENT_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$COMMENT_DATA" "$BASE_URL/api/v1/community/posts/$POST_ID/comments")
COMMENT_ID=$(echo "$COMMENT_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$COMMENT_ID" ]; then
    echo -e "${GREEN}✅ Created comment: $COMMENT_ID${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Failed to create comment${NC}"
    ((FAILED++))
fi

test_endpoint "Get Post Comments" "GET" "/api/v1/community/posts/$POST_ID/comments" "" "$TOKEN"
test_endpoint "Get Available Tags" "GET" "/api/v1/community/tags" "" "$TOKEN"

echo ""

# ============================================
# NOTIFICATION SERVICE TESTS
# ============================================
echo "🔔 Testing Notification Services"
echo "--------------------------------"

test_endpoint "List Notifications" "GET" "/api/v1/notifications" "" "$TOKEN"
test_endpoint "Get Unread Count" "GET" "/api/v1/notifications/unread-count" "" "$TOKEN"

# Create a notification (via service, not endpoint)
# We'll just test the read endpoints

echo ""

# ============================================
# HOMEPETS SERVICE TESTS
# ============================================
echo "🐾 Testing HomePets Services"
echo "---------------------------"

test_endpoint "Get User Pet" "GET" "/api/v1/homepets" "" "$TOKEN"
test_endpoint "Update User Pet" "PUT" "/api/v1/homepets" "{\"name\":\"Fluffy\",\"type\":\"cat\",\"level\":2}" "$TOKEN"

echo ""

# ============================================
# CLEANUP
# ============================================
echo "🧹 Cleanup"
echo "----------"

# Delete test resources
if [ -n "$JOURNAL_ID" ]; then
    curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/journals/$JOURNAL_ID" > /dev/null
    echo -e "${GREEN}✅ Deleted test journal${NC}"
fi

if [ -n "$GOAL_ID" ]; then
    curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/goals/$GOAL_ID" > /dev/null
    echo -e "${GREEN}✅ Deleted test goal${NC}"
fi

if [ -n "$POST_ID" ]; then
    curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v1/community/posts/$POST_ID" > /dev/null
    echo -e "${GREEN}✅ Deleted test post${NC}"
fi

echo ""

# ============================================
# SUMMARY
# ============================================
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    PERCENTAGE=$((PASSED * 100 / TOTAL))
    echo "📈 Success Rate: $PERCENTAGE%"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! TypeORM migration is successful!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the errors above.${NC}"
    exit 1
fi

