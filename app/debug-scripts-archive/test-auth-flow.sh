#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}   MathQuest Authentication Tester   ${NC}"
echo -e "${BLUE}=====================================${NC}"

# Define constants
BASE_URL="http://localhost:3008"
AUTH_ENDPOINT="${BASE_URL}/api/auth/universal-login"
STATUS_ENDPOINT="${BASE_URL}/api/auth/status"
BACKEND_STATUS_ENDPOINT="${BASE_URL}/api/auth/status"
LOGIN_PAGE="${BASE_URL}/login"
HOME_PAGE="${BASE_URL}/"
TEST_EMAIL="alexis.flesch@gmail.com"
TEST_PASSWORD="coucoucc"
COOKIES_FILE="auth_cookies.txt"

# Clean up any existing cookies file
rm -f $COOKIES_FILE

# Function to print section headers
section() {
  echo -e "\n${PURPLE}=== $1 ===${NC}"
}

# Function to print step information
step() {
  echo -e "${CYAN}>> $1${NC}"
}

# Function to print success messages
success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
error() {
  echo -e "${RED}✗ $1${NC}"
}

# Function to print warning/info messages
info() {
  echo -e "${YELLOW}! $1${NC}"
}

# Function to check if a JSON response contains a specific field
has_field() {
  response="$1"
  field="$2"
  if echo "$response" | grep -q "\"$field\""; then
    return 0
  else
    return 1
  fi
}

# Function to check authentication status
check_auth_status() {
  local endpoint=$1
  local message=$2
  local auth_status=$(curl -s -b $COOKIES_FILE $endpoint)
  echo "$auth_status"
  
  if echo "$auth_status" | grep -q "\"hasTeacherToken\":true" || echo "$auth_status" | grep -q "\"teacherToken\""; then
    success "$message - authenticated as teacher"
    return 0
  elif echo "$auth_status" | grep -q "\"hasAuthToken\":true" || echo "$auth_status" | grep -q "\"authToken\""; then
    success "$message - authenticated as student"
    return 0
  else
    error "$message - not authenticated"
    return 1
  fi
}

# Function to examine cookie details
examine_cookies() {
  echo -e "\n${BLUE}Current cookies:${NC}"
  if [ -s "$COOKIES_FILE" ]; then
    grep -e "authToken\|teacherToken" $COOKIES_FILE || echo "No auth tokens found"
    echo -e "\n${BLUE}Cookie domains:${NC}"
    grep "domain" $COOKIES_FILE | grep -e "authToken\|teacherToken" || echo "No domains found"
    echo -e "\n${BLUE}Cookie paths:${NC}"
    grep "path" $COOKIES_FILE | grep -e "authToken\|teacherToken" || echo "No paths found"
    echo -e "\n${BLUE}Cookie expiration:${NC}"
    grep "expires" $COOKIES_FILE | grep -e "authToken\|teacherToken" || echo "No expiration found"
    echo -e "\n${BLUE}HTTP Only flags:${NC}"
    grep "httponly" $COOKIES_FILE | grep -e "authToken\|teacherToken" || echo "No HTTP Only flags found"
  else
    echo "No cookies file found or file is empty"
  fi
}

# Step 1: Test direct backend vs frontend authentication
section "TESTING BACKEND VS FRONTEND AUTHENTICATION ENDPOINTS"

step "Testing login through frontend proxy"
LOGIN_RESPONSE=$(curl -s -c $COOKIES_FILE -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  $AUTH_ENDPOINT)

if echo "$LOGIN_RESPONSE" | grep -q "\"token\""; then
  success "Login successful through frontend proxy"
else
  error "Login failed through frontend proxy"
  echo "$LOGIN_RESPONSE"
fi

examine_cookies

step "Checking frontend auth status"
check_auth_status $STATUS_ENDPOINT "Frontend auth status"

step "Checking backend auth status (should have tokens if proxied correctly)"
check_auth_status $BACKEND_STATUS_ENDPOINT "Backend auth status"

# Step 2: Test middleware redirection
section "TESTING MIDDLEWARE REDIRECTION"

step "Accessing login page with authenticated cookies (expecting redirect)"
LOGIN_HEADERS=$(curl -s -I -b $COOKIES_FILE $LOGIN_PAGE)
echo "$LOGIN_HEADERS" | grep -E "HTTP|Location:"

if echo "$LOGIN_HEADERS" | grep -q "307 Temporary Redirect"; then
  success "Middleware successfully redirected from login page"
  
  # Check where it's redirecting to
  REDIRECT_URL=$(echo "$LOGIN_HEADERS" | grep "Location:" | sed -e "s/Location: //g" | tr -d '\r')
  info "Redirect URL: $REDIRECT_URL"
  
  if [[ "$REDIRECT_URL" == "$HOME_PAGE" ]]; then
    success "Redirecting to home page as expected"
  else
    error "Unexpected redirect destination: $REDIRECT_URL"
  fi
else
  error "Middleware redirection failed - not being redirected from login page"
fi

# Step 3: Test following the redirect with cookie preservation
section "TESTING REDIRECT FLOW WITH COOKIE PRESERVATION"

step "Following redirect from login page and preserving cookies"
curl -s -L -b $COOKIES_FILE -c $COOKIES_FILE $LOGIN_PAGE > /dev/null

step "Examining cookies after redirect"
examine_cookies

step "Checking auth status after redirect"
check_auth_status $STATUS_ENDPOINT "Auth status after redirect"

# Step 4: Test Login Page Special Behavior
section "TESTING LOGIN PAGE INTERACTIONS"

# First clear cookies and login again to start fresh
rm -f $COOKIES_FILE
step "Creating fresh authenticated session"
curl -s -c $COOKIES_FILE -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  $AUTH_ENDPOINT > /dev/null

step "Examining fresh cookies"
examine_cookies

step "Accessing login page directly with -L to follow redirects"
RESPONSE=$(curl -s -L -b $COOKIES_FILE -c $COOKIES_FILE -D - $LOGIN_PAGE)
echo "$RESPONSE" | grep -E "HTTP|Location:|Set-Cookie:" | head -10

step "Examining cookies after login page access with redirects"
examine_cookies

step "Checking auth status after login page redirect"
check_auth_status $STATUS_ENDPOINT "Auth status after login page redirect"

# Step 5: Investigating Cookie Domains
section "INVESTIGATING COOKIE DOMAIN ISSUES"

rm -f $COOKIES_FILE
step "Setting cookies through direct backend call (potentially wrong domain)"
BACKEND_LOGIN=$(curl -s -c $COOKIES_FILE -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  "http://localhost:3007/api/v1/auth")

step "Examining cookies from direct backend login"
examine_cookies

step "Testing if these cookies work with frontend"
check_auth_status $STATUS_ENDPOINT "Auth status with direct backend cookies"

rm -f $COOKIES_FILE
step "Setting cookies through frontend proxy (should set correct domain)"
FRONTEND_LOGIN=$(curl -s -c $COOKIES_FILE -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  $AUTH_ENDPOINT)

step "Examining cookies from frontend proxy login"
examine_cookies

step "Testing if these cookies work with backend"
check_auth_status $BACKEND_STATUS_ENDPOINT "Backend auth status with frontend proxy cookies"

# Step 6: Test cookie clearing through login page logic
section "TESTING LOGIN PAGE COOKIE HANDLING"

rm -f $COOKIES_FILE
step "Setting authenticated session"
curl -s -c $COOKIES_FILE -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  $AUTH_ENDPOINT > /dev/null

step "Sending request to login page with verbose cookie tracking"
VERBOSE_RESPONSE=$(curl -s -v -b $COOKIES_FILE -c updated_cookies.txt $LOGIN_PAGE 2>&1)
echo "$VERBOSE_RESPONSE" | grep -E "Cookie:|Set-Cookie:|< HTTP|> GET" | head -10

step "Comparing original cookies with updated cookies"
echo -e "\n${BLUE}Original cookies:${NC}"
cat $COOKIES_FILE | grep -e "authToken\|teacherToken" || echo "No auth tokens found"
echo -e "\n${BLUE}Updated cookies:${NC}"
cat updated_cookies.txt | grep -e "authToken\|teacherToken" || echo "No auth tokens found"

# Step 7: Testing API endpoint handling of cookies
section "TESTING API ENDPOINT COOKIE HANDLING"

step "Testing auth status API for cookie preservation"
curl -s -v -b $COOKIES_FILE -c status_cookies.txt $STATUS_ENDPOINT > /dev/null 2>&1

step "Comparing cookies after status API call"
echo -e "\n${BLUE}Original cookies:${NC}"
cat $COOKIES_FILE | grep -e "authToken\|teacherToken" || echo "No auth tokens found"
echo -e "\n${BLUE}Cookies after status API:${NC}"
cat status_cookies.txt | grep -e "authToken\|teacherToken" || echo "No auth tokens found"

# Step 8: Testing for Cookie Name Mismatches
section "TESTING FOR COOKIE NAME MISMATCHES"

step "Searching for old 'mathquest_teacher' cookie references:"
LEGACY_REFS=$(grep -r "mathquest_teacher" --include="*.ts" --include="*.tsx" /home/aflesch/mathquest/app/frontend/src 2>/dev/null)
if [ -n "$LEGACY_REFS" ]; then
    error "FOUND LEGACY COOKIE REFERENCES:"
    echo "$LEGACY_REFS"
    echo -e "\n${RED}⚠️  CRITICAL: Some components are still looking for 'mathquest_teacher' cookies${NC}"
    echo -e "${RED}    while the new system uses 'teacherToken' cookies!${NC}"
else
    success "No legacy 'mathquest_teacher' cookie references found"
fi

step "Searching for new 'teacherToken' cookie references:"
NEW_REFS=$(grep -r "teacherToken" --include="*.ts" --include="*.tsx" /home/aflesch/mathquest/app/frontend/src 2>/dev/null)
if [ -n "$NEW_REFS" ]; then
    success "Found new 'teacherToken' cookie references:"
    echo "$NEW_REFS" | head -5
else
    error "No 'teacherToken' cookie references found"
fi

step "Testing authentication flow with cookie name analysis:"
rm -f $COOKIES_FILE
UNIVERSAL_LOGIN=$(curl -s -c $COOKIES_FILE -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  $AUTH_ENDPOINT)

echo -e "\n${BLUE}Cookies set by universal-login:${NC}"
cat $COOKIES_FILE | grep -E "(teacherToken|mathquest_teacher|authToken)" || echo "No authentication cookies found"

# Test what the status endpoint expects
step "Testing what cookies the status endpoint reads:"
STATUS_RESPONSE=$(curl -s -b $COOKIES_FILE $STATUS_ENDPOINT)
echo "Status response: $STATUS_RESPONSE"

# Step 9: Identifying potential cookie clearing code
section "IDENTIFYING POTENTIAL COOKIE CLEARING CODE"

step "Files that mention cookie clearing:"
grep -r "cookies.delete\|clear.*cookie\|cookie.*clear" --include="*.ts" --include="*.tsx" /home/aflesch/mathquest/app/frontend/src | head -10

step "Files that set authentication cookies:"
grep -r "cookies.set.*\(authToken\|teacherToken\)" --include="*.ts" --include="*.tsx" /home/aflesch/mathquest/app/frontend/src | head -10

step "Testing component-level cookie checking:"
echo -e "\n${BLUE}Checking if components like AppNav are using correct cookie names:${NC}"

# Check if AppNav component exists and what cookies it looks for
if [ -f "/home/aflesch/mathquest/app/frontend/src/components/AppNav.tsx" ]; then
    APPNAV_COOKIES=$(grep -n "cookie\|Cookie" /home/aflesch/mathquest/app/frontend/src/components/AppNav.tsx 2>/dev/null || echo "No cookie references found")
    echo "AppNav.tsx cookie references: $APPNAV_COOKIES"
fi

# Check utils.ts for cookie handling
if [ -f "/home/aflesch/mathquest/app/frontend/src/utils.ts" ]; then
    UTILS_COOKIES=$(grep -n "mathquest_teacher\|teacherToken" /home/aflesch/mathquest/app/frontend/src/utils.ts 2>/dev/null || echo "No cookie references found")
    echo "utils.ts cookie references: $UTILS_COOKIES"
fi

# Summary and cleanup
section "TEST SUMMARY"

# Check the current auth state one final time
step "Final auth status check"
check_auth_status $STATUS_ENDPOINT "Final auth status"

# Clean up created files
rm -f updated_cookies.txt status_cookies.txt

echo -e "\n${YELLOW}==========================================${NC}"
echo -e "${YELLOW}    Test Complete - Findings Summary     ${NC}"
echo -e "${YELLOW}==========================================${NC}"

echo -e "\n1. If you see auth loss after login page access, the issue is likely:"
echo -e "   - Cookies being set with incorrect domain/path"
echo -e "   - Middleware or login page clearing cookies unintentionally"
echo -e "   - Redirect handling not preserving cookies properly"

echo -e "\n2. Check for discrepancies between:"
echo -e "   - Backend direct authentication vs. frontend proxy"
echo -e "   - Cookie domains between frontend (localhost:3008) and backend (localhost:3010)"

echo -e "\n3. Test the login page with both authenticated and unauthenticated users"
echo -e "   - Ensure middleware redirects properly"
echo -e "   - Verify cookies are preserved through redirects"

echo -e "\nFor browser testing, check the Network tab to see all cookie traffic"
echo -e "and confirm domains match what your application expects.\n"
