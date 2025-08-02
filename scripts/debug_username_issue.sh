#!/bin/bash

# Debug script to monitor username vs cookieId issues in the MathQuest logs
# This script tails the backend logs and highlights any instances where cookieId might be used as username

echo "🐛 Monitoring MathQuest logs for username vs cookieId issues..."
echo "Watching for patterns that might indicate cookieId being used as username"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Colors for highlighting
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a string looks like a cookieId (long hex string)
is_cookie_id_pattern() {
    local str="$1"
    # Check if string is longer than 20 chars and contains only hex characters
    if [[ ${#str} -gt 20 && "$str" =~ ^[a-f0-9]+$ ]]; then
        return 0
    else
        return 1
    fi
}

# Monitor the backend logs
tail -f /home/aflesch/mathquest/app/backend/logs/combined.log | while read line; do
    # Look for our debug markers
    if echo "$line" | grep -q "USERNAME_DEBUG\|PARTICIPANT_REDIS_DEBUG\|LEADERBOARD_METADATA_DEBUG"; then
        echo -e "${BLUE}[DEBUG]${NC} $line"
        
        # Extract username from the log line and check if it looks like a cookieId
        if echo "$line" | grep -q '"username":'; then
            username=$(echo "$line" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
            if [ -n "$username" ] && is_cookie_id_pattern "$username"; then
                echo -e "${RED}🚨 POTENTIAL ISSUE: Username looks like cookieId: $username${NC}"
                echo -e "${YELLOW}Full log line: $line${NC}"
                echo ""
            fi
        fi
    fi
    
    # Also look for any leaderboard entries with suspicious usernames
    if echo "$line" | grep -q "leaderboard\|participants"; then
        if echo "$line" | grep -qE '"username":"[a-f0-9]{20,}"'; then
            echo -e "${RED}🚨 SUSPICIOUS: Long hex string as username in leaderboard/participants${NC}"
            echo -e "${YELLOW}$line${NC}"
            echo ""
        fi
    fi
done
