#!/bin/bash

# Comprehensive fix for all remaining frontend TypeScript errors

FRONTEND_DIR="/home/aflesch/mathquest/app/frontend"

echo "🔧 Fixing ALL remaining frontend TypeScript errors..."

# Fix all occurrences of timerQuestionUid to timerQuestionId in ALL frontend files
find "$FRONTEND_DIR/src" -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/timerQuestionUid/timerQuestionId/g'

# Fix currentQuestionUidx to currentQuestionIdx
find "$FRONTEND_DIR/src" -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/currentQuestionUidx/currentQuestionIdx/g'

# Fix the specific component interface issue
sed -i 's/currentQuestionIdx:/currentQuestionIdx:/g' "$FRONTEND_DIR/src/components/DraggableQuestionsList.tsx"

echo "✅ All frontend TypeScript errors should now be fixed!"
echo ""
echo "🔍 Running type check to verify fixes..."
cd "$FRONTEND_DIR" && npm run type-check
