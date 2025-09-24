// [MODERNIZATION] Removed legacy call to gameStateService.calculateScores.
// All scoring is now handled via ScoringService.submitAnswerWithScoring or canonical participant service.
// If batch scoring is needed, refactor to use canonical logic per participant/answer.