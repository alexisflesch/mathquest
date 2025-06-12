#!/bin/bash

# Fix remaining TypeScript errors from questionId vs questionUid migration
# This script handles the complex cases that the simple replacement scripts missed

echo "🔧 Fixing remaining TypeScript errors from questionId vs questionUid migration..."

# Frontend fixes
echo "📱 Fixing frontend errors..."

# Fix useUnifiedGameManager.ts - change questionId to questionUid in GameAnswerPayload
sed -i 's/questionId: questionUid,/questionUid: questionUid,/g' /home/aflesch/mathquest/app/frontend/src/hooks/useUnifiedGameManager.ts

# Fix TeacherDashboardClient.tsx - change timerQuestionId to timerQuestionUid
sed -i 's/timerQuestionId={null}/timerQuestionUid={null}/g' /home/aflesch/mathquest/app/frontend/src/app/teacher/TeacherDashboardClient.tsx

# Fix dashboard page - change currentQuestionUidx to currentQuestionIdx
sed -i 's/currentQuestionUidx/currentQuestionIdx/g' /home/aflesch/mathquest/app/frontend/src/app/teacher/dashboard/[code]/page.tsx

# Fix games/new page - remove optional syntax errors
sed -i 's/questionUid?: /questionUid: /g' /home/aflesch/mathquest/app/frontend/src/app/teacher/games/new/page.tsx

# Fix projection page - change timerQuestionId to timerQuestionUid
sed -i 's/timerQuestionId,/timerQuestionUid,/g' /home/aflesch/mathquest/app/frontend/src/app/teacher/projection/[gameCode]/page.tsx

# Fix test files - change currentQuestionUidx to currentQuestionIdx
sed -i 's/currentQuestionUidx/currentQuestionIdx/g' /home/aflesch/mathquest/app/frontend/src/hooks/__tests__/useTeacherQuizSocket.eventListeners.test.ts
sed -i 's/currentQuestionUidx/currentQuestionIdx/g' /home/aflesch/mathquest/app/frontend/src/hooks/__tests__/useTeacherQuizSocket.timer.test.ts

# Fix migration files
sed -i 's/currentQuestionUidx/currentQuestionIdx/g' /home/aflesch/mathquest/app/frontend/src/hooks/migrations/useProjectionQuizSocketMigrated.ts
sed -i 's/currentQuestionUidx/currentQuestionIdx/g' /home/aflesch/mathquest/app/frontend/src/hooks/migrations/useTeacherQuizSocketMigrated.ts

# Fix useProjectionQuizSocket.ts - change timerQuestionUid back to timerQuestionId and currentQuestionUidx to currentQuestionIdx
sed -i 's/timerQuestionUid/timerQuestionId/g' /home/aflesch/mathquest/app/frontend/src/hooks/useProjectionQuizSocket.ts
sed -i 's/currentQuestionUidx/currentQuestionIdx/g' /home/aflesch/mathquest/app/frontend/src/hooks/useProjectionQuizSocket.ts

# Fix useTeacherQuizSocket.ts - change timerQuestionUid back to timerQuestionId and fix questionId references
sed -i 's/timerQuestionUid/timerQuestionId/g' /home/aflesch/mathquest/app/frontend/src/hooks/useTeacherQuizSocket.ts
sed -i 's/action\.questionId/action.questionUid/g' /home/aflesch/mathquest/app/frontend/src/hooks/useTeacherQuizSocket.ts

echo "🖥️  Fixing backend errors..."

# Backend fixes
# Fix games.ts
sed -i 's/questionUids/questionIds/g' /home/aflesch/mathquest/app/backend/src/api/v1/games.ts

# Fix quizTemplates.ts - restore questionId variable
sed -i 's/if (!questionId)/if (!questionUid)/g' /home/aflesch/mathquest/app/backend/src/api/v1/quizTemplates.ts
sed -i 's/where: { uid: questionId }/where: { uid: questionUid }/g' /home/aflesch/mathquest/app/backend/src/api/v1/quizTemplates.ts
sed -i 's/questionUid: questionId/questionUid: questionUid/g' /home/aflesch/mathquest/app/backend/src/api/v1/quizTemplates.ts

# Fix gameStateService.ts - restore questionId variable and fix references
sed -i 's/questionUid}/questionId}/g' /home/aflesch/mathquest/app/backend/src/core/gameStateService.ts
sed -i 's/where: { uid: questionId }/where: { uid: questionUid }/g' /home/aflesch/mathquest/app/backend/src/core/gameStateService.ts
sed -i 's/logger\.warn({ accessCode, questionId }, '\''Question not found/logger.warn({ accessCode, questionUid }, '\''Question not found/g' /home/aflesch/mathquest/app/backend/src/core/gameStateService.ts
sed -i 's/logger\.warn({ accessCode, questionId, questionType/logger.warn({ accessCode, questionUid, questionType/g' /home/aflesch/mathquest/app/backend/src/core/gameStateService.ts
sed -i 's/ans\.questionId === questionId/ans.questionUid === questionUid/g' /home/aflesch/mathquest/app/backend/src/core/gameStateService.ts
sed -i 's/logger\.debug({ accessCode, questionId, userId/logger.debug({ accessCode, questionUid, userId/g' /home/aflesch/mathquest/app/backend/src/core/gameStateService.ts
sed -i 's/logger\.error({ accessCode, questionId, userId/logger.error({ accessCode, questionUid, userId/g' /home/aflesch/mathquest/app/backend/src/core/gameStateService.ts
sed -i 's/logger\.info({ accessCode, questionId }/logger.info({ accessCode, questionUid }/g' /home/aflesch/mathquest/app/backend/src/core/gameStateService.ts
sed -i 's/logger\.error({ accessCode, questionId, error/logger.error({ accessCode, questionUid, error/g' /home/aflesch/mathquest/app/backend/src/core/gameStateService.ts

# Fix service files
sed -i 's/questionUid,/questionId,/g' /home/aflesch/mathquest/app/backend/src/core/services/gameTemplateService.ts
sed -i 's/questionUid: questionId/questionUid: questionUid/g' /home/aflesch/mathquest/app/backend/src/core/services/gameTemplateService.ts

sed -i 's/where: { uid: questionId }/where: { uid: questionUid }/g' /home/aflesch/mathquest/app/backend/src/core/services/quizTemplateService.ts
sed -i 's/questionUid: questionId/questionUid: questionUid/g' /home/aflesch/mathquest/app/backend/src/core/services/quizTemplateService.ts
sed -i 's/update\.questionId/update.questionUid/g' /home/aflesch/mathquest/app/backend/src/core/services/quizTemplateService.ts

# Fix socket handlers
sed -i 's/logger\.warn({ errorPayload, accessCode, userId, questionId }/logger.warn({ errorPayload, accessCode, userId, questionUid }/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/game/gameAnswer.ts
sed -i 's/logger\.error({ err, accessCode, userId, questionId }/logger.error({ err, accessCode, userId, questionUid }/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/game/gameAnswer.ts
sed -i 's/logger\.debug({ userId, gameInstanceId: gameInstance\.id, questionId, answer/logger.debug({ userId, gameInstanceId: gameInstance.id, questionUid, answer/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/game/gameAnswer.ts
sed -i 's/where: { uid: questionId }/where: { uid: questionUid }/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/game/gameAnswer.ts
sed -i 's/logger\.debug({ isCorrect, questionId, answer }/logger.debug({ isCorrect, questionUid, answer }/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/game/gameAnswer.ts
sed -i 's/if (questionId && !answeredQuestions\.includes(questionId))/if (questionUid \&\& !answeredQuestions.includes(questionUid))/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/game/gameAnswer.ts
sed -i 's/answeredQuestions\.push(questionId)/answeredQuestions.push(questionUid)/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/game/gameAnswer.ts
sed -i 's/if (questionId && timeSpent !== undefined)/if (questionUid \&\& timeSpent !== undefined)/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/game/gameAnswer.ts

# Fix sharedLiveHandler.ts
sed -i 's/socket\.emit('\''feedback'\'', { questionUid, feedbackRemaining/socket.emit('\''feedback'\'', { questionUid: currentQuestionUid, feedbackRemaining/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/sharedLiveHandler.ts
sed -i 's/logger\.info({ accessCode, userId, questionUid, playMode/logger.info({ accessCode, userId, questionUid: currentQuestionUid, playMode/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/sharedLiveHandler.ts
sed -i 's/questionId !== gameState\.questionIds/questionUid !== gameState.questionIds/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/sharedLiveHandler.ts
sed -i 's/a\.questionId === questionId/a.questionUid === questionUid/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/sharedLiveHandler.ts
sed -i 's/where: { uid: questionId }/where: { uid: questionUid }/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/sharedLiveHandler.ts
sed -i 's/socket\.emit('\''answer_feedback'\'', { status: '\''ok'\'', questionId, scoreAwarded/socket.emit('\''answer_feedback'\'', { status: '\''ok'\'', questionUid, scoreAwarded/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/sharedLiveHandler.ts
sed -i 's/await collectAnswers(accessCode, questionId)/await collectAnswers(accessCode, questionUid)/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/sharedLiveHandler.ts
sed -i 's/questionId: payload\.questionId/questionUid: payload.questionUid/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/sharedLiveHandler.ts

# Fix helper files
sed -i 's/logger\.error({ accessCode, questionId, error }/logger.error({ accessCode, questionUid, error }/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/helpers.ts

# Fix setQuestion.ts
sed -i 's/questionUid,/questionUid: questionUid,/g' /home/aflesch/mathquest/app/backend/src/sockets/handlers/teacherControl/setQuestion.ts

# Fix test files
sed -i 's/questionId: questionUid,/questionUid: questionUid,/g' /home/aflesch/mathquest/app/backend/tests/integration/mockedGameHandler.test.ts

echo "✅ TypeScript error fixes completed!"
echo ""
echo "🔍 Running type check to verify fixes..."
