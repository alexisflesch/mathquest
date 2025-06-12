#!/bin/bash

# Phase 3: Manual Migration Fixes
# Fixes complex cases that automated migration couldn't handle

set -e

echo "🔧 Applying manual fixes for complex migration cases..."
echo "===================================================="

cd /home/aflesch/mathquest/app/frontend

echo "🔧 Fixing hook export issues..."

# Fix useTeacherQuizSocket.ts - update variable names in return object
sed -i 's/timeLeftMs,/timeLeft: timeLeftMs,/' src/hooks/useTeacherQuizSocket.ts
sed -i 's/localTimeLeftMs,/localTimeLeft: localTimeLeftMs,/' src/hooks/useTeacherQuizSocket.ts

# Fix useProjectionQuizSocket.ts - update variable names in return object  
sed -i 's/timeLeftMs,/timeLeft: timeLeftMs,/' src/hooks/useProjectionQuizSocket.ts
sed -i 's/localTimeLeftMs,/localTimeLeft: localTimeLeftMs,/' src/hooks/useProjectionQuizSocket.ts

echo "🔧 Fixing useGameTimer.ts variable references..."
# Fix useGameTimer.ts internal variable references
sed -i 's/timeLeftMs:/timeLeft:/' src/hooks/useGameTimer.ts
sed -i 's/timeLeftMs,/timeLeft,/' src/hooks/useGameTimer.ts

echo "🔧 Fixing component prop destructuring..."
# Fix components that still reference old prop names
sed -i 's/{ timeLeft }/{ timeLeftMs: timeLeft }/' src/components/DraggableQuestionsList.tsx
sed -i 's/timeLeft ??/timeLeft ??/' src/components/DraggableQuestionsList.tsx

echo "🔧 Fixing test object syntax errors..."
# Fix test files with syntax errors (remove ?: from object properties)
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/timeLeftMs?:/timeLeftMs:/g'
find src/ -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's/localTimeLeftMs?:/localTimeLeftMs:/g'

echo "🔧 Fixing migration hook syntax issues..."
# Fix migration hooks syntax errors
sed -i 's/timeLeftMs?:/timeLeftMs:/g' src/hooks/migrations/*.ts
sed -i 's/localTimeLeftMs?:/localTimeLeftMs:/g' src/hooks/migrations/*.ts

echo "🔧 Fixing app page component references..."
# Fix app pages that still reference old field names
sed -i 's/localTimeLeft,/localTimeLeft: localTimeLeftMs,/' src/app/debug/timer/page.tsx
sed -i 's/timeLeft,/timeLeft: timeLeftMs,/' src/app/teacher/dashboard/\\[code\\]/page.tsx
sed -i 's/localTimeLeft,/localTimeLeft: localTimeLeftMs,/' src/app/teacher/dashboard/\\[code\\]/page.tsx
sed -i 's/localTimeLeft,/localTimeLeft: localTimeLeftMs,/' src/app/teacher/projection/\\[gameCode\\]/page.tsx

echo "🔧 Fixing component usage..."
# Fix component prop usage to use correct field names
sed -i 's/timeLeft={/timeLeftMs={/' src/components/SortableQuestion.tsx

echo "✅ Manual fixes completed!"
echo ""
echo "📊 Next step: Run verification script again"
echo "    ./scripts/verify-migration.sh"
