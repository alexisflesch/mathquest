#!/bin/bash

# Script to run E2E tests one by one and log results
# Usage: ./run-tests-individually.sh

LOG_FILE="test-execution-log.md"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Initialize log file
cat > "$LOG_FILE" << EOF
# E2E Test Execution Log
**Date**: $TIMESTAMP

## Test Results

| Test File | Status | Duration | Notes |
|-----------|--------|----------|-------|
EOF

echo "Starting individual E2E test execution..."
echo "Results will be logged to: $LOG_FILE"
echo ""

# Get all test files
TEST_FILES=(
  "background-resume-dedupe.spec.ts"
  "comprehensive-full-flow.spec.ts"
  "debug-login.spec.ts"
  "debug-zoom.spec.ts"
  "excludedfrom-mode-filtering.spec.ts"
  "game-templates.spec.ts"
  "late-join-bug-investigation.spec.ts"
  "late-join-show-answers.spec.ts"
  "late-joiners.spec.ts"
  "mobile-live-freeze-repro.spec.ts"
  "mobile-mc-live-freeze-repro.spec.ts"
  "multiple-choice-answer-reversion.spec.ts"
  "numeric-answer-reversion.spec.ts"
  "practice-mode.spec.ts"
  "practice-session-recovery.spec.ts"
  "question-database.spec.ts"
  "quiz-flow.spec.ts"
  "single-choice-answer-reversion.spec.ts"
  "student-create-game-filtering.spec.ts"
  "teacher-editor-scrollbars.spec.ts"
  "teacher-timer-controls.spec.ts"
  "test_guest_join_flow.spec.ts"
  "tournament-creation.spec.ts"
  "tournament-deferred.spec.ts"
  "tournament-full-flow-clean.spec.ts"
  "tournament-mode.spec.ts"
  "user-registration.spec.ts"
  "zoom-controls.spec.ts"
)

PASSED=0
FAILED=0
SKIPPED=0

for test_file in "${TEST_FILES[@]}"; do
  echo "Running: $test_file"
  
  START_TIME=$(date +%s)
  
  # Run the test and capture output
  if npm run -s test:e2e -- "tests/e2e/$test_file" > "/tmp/test-output-$$.txt" 2>&1; then
    STATUS="✅ PASS"
    ((PASSED++))
  else
    # Check if test was skipped
    if grep -q "no tests found" "/tmp/test-output-$$.txt" 2>/dev/null; then
      STATUS="⏭️ SKIP"
      ((SKIPPED++))
    else
      STATUS="❌ FAIL"
      ((FAILED++))
    fi
  fi
  
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  
  # Extract key info from output
  NOTES=""
  if grep -q "Error:" "/tmp/test-output-$$.txt" 2>/dev/null; then
    ERROR_MSG=$(grep "Error:" "/tmp/test-output-$$.txt" | head -1 | cut -c1-60)
    NOTES="$ERROR_MSG..."
  fi
  
  # Append to log
  echo "| $test_file | $STATUS | ${DURATION}s | $NOTES |" >> "$LOG_FILE"
  
  echo "  Result: $STATUS (${DURATION}s)"
  echo ""
  
  # Clean up temp file
  rm -f "/tmp/test-output-$$.txt"
  
  # Small delay between tests
  sleep 1
done

# Add summary to log
cat >> "$LOG_FILE" << EOF

## Summary

- ✅ **Passed**: $PASSED
- ❌ **Failed**: $FAILED
- ⏭️ **Skipped**: $SKIPPED
- **Total**: ${#TEST_FILES[@]}

EOF

echo "=========================================="
echo "Test execution complete!"
echo "Passed: $PASSED | Failed: $FAILED | Skipped: $SKIPPED"
echo "Full log available at: $LOG_FILE"
echo "=========================================="
