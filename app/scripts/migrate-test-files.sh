#!/bin/bash

# Test Files Timer Migration Script
# Updates remaining timer field references in test files

set -e

echo "🧪 Test Files Timer Migration"
echo "============================="

cd /home/aflesch/mathquest/app/frontend

echo "📊 Updating test files with remaining timer references..."

# Update timeLeft to timeLeftMs in test files (be careful not to break comments)
echo "🔧 Updating timeLeft references in test expectations..."

# Update test expectations and mock objects
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/expect(.*\.timeLeft)/expect(result.current.timeLeftMs)/g'
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/result\.current\.timeLeft/result.current.timeLeftMs/g'

# Update localTimeLeft references in tests
echo "🔧 Updating localTimeLeft references in test expectations..."
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/expect(.*\.localTimeLeft)/expect(result.current.localTimeLeftMs)/g'
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/result\.current\.localTimeLeft/result.current.localTimeLeftMs/g'

# Update mock object properties
echo "🔧 Updating mock object properties..."
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/timeLeft:/timeLeftMs:/g'
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/localTimeLeft:/localTimeLeftMs:/g'

# Update variable declarations in tests (but be careful about comments)
echo "🔧 Updating variable declarations in tests..."
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/const timeLeft =/const timeLeftMs =/g'
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/let timeLeft =/let timeLeftMs =/g'

# Fix specific test cases that use timeLeft as a local variable
echo "🔧 Fixing specific test variable usage..."
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/const timeLeftMs = testCase\.input\.timeRemaining || 0;/const timeLeftMs = testCase.input.timeRemaining || 0;/g'
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/timeLeftMs > 0/timeLeftMs > 0/g'

echo "✅ Test files migration completed!"

echo ""
echo "📊 Running verification..."
REMAINING_TIMELEFT=$(grep -r "timeLeft[^M]" --include="*.test.ts" --include="*.test.tsx" src/ 2>/dev/null | wc -l || echo "0")
REMAINING_LOCALTIMELEFT=$(grep -r "localTimeLeft[^M]" --include="*.test.ts" --include="*.test.tsx" src/ 2>/dev/null | wc -l || echo "0")

echo "  - Remaining timeLeft in tests: $REMAINING_TIMELEFT"
echo "  - Remaining localTimeLeft in tests: $REMAINING_LOCALTIMELEFT"

if [ $REMAINING_TIMELEFT -lt 20 ] && [ $REMAINING_LOCALTIMELEFT -lt 5 ]; then
    echo "🎉 Test migration successful!"
else
    echo "⚠️  Some references may need manual review"
fi
