#!/bin/bash

# Fix remaining frontend TypeScript errors related to questionId vs questionUid

FRONTEND_DIR="/home/aflesch/mathquest/app/frontend"

echo "🔧 Fixing remaining frontend TypeScript errors..."

# Fix test files - replace timerQuestionUid with timerQuestionId
sed -i 's/timerQuestionUid:/timerQuestionId:/g' "$FRONTEND_DIR/src/hooks/__tests__/useTeacherQuizSocket.timer.test.ts"
sed -i 's/\.timerQuestionUid/\.timerQuestionId/g' "$FRONTEND_DIR/src/hooks/__tests__/useTeacherQuizSocket.timer.test.ts"
sed -i 's/timerQuestionUid)/timerQuestionId)/g' "$FRONTEND_DIR/src/hooks/__tests__/useTeacherQuizSocket.timer.test.ts"

# Fix migration files
sed -i 's/currentQuestionUidx/currentQuestionIdx/g' "$FRONTEND_DIR/src/hooks/migrations/useTeacherQuizSocketMigrated.ts"
sed -i 's/timerQuestionUid/timerQuestionId/g' "$FRONTEND_DIR/src/hooks/migrations/useTeacherQuizSocketMigrated.ts"

# Fix the DraggableQuestionsList component interface to expect currentQuestionIdx instead of currentQuestionUidx
sed -i 's/currentQuestionUidx:/currentQuestionIdx:/g' "$FRONTEND_DIR/src/components/DraggableQuestionsList.tsx"

echo "✅ Frontend TypeScript errors fixed!"
echo ""
echo "🔍 Running type check to verify fixes..."
cd "$FRONTEND_DIR" && npm run type-check
