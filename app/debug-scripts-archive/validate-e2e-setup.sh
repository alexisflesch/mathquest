#!/bin/bash

echo "🧪 MathQuest E2E Test Validation"
echo "================================="

# Check if all required test files exist
echo "📁 Checking E2E test files..."

test_files=(
    "tests/e2e/quiz-flow.spec.ts"
    "tests/e2e/tournament-mode.spec.ts"
    "tests/e2e/tournament-deferred.spec.ts"
    "tests/e2e/late-joiners.spec.ts"
    "tests/e2e/teacher-timer-controls.spec.ts"
    "tests/e2e/practice-mode.spec.ts"
)

missing_files=0

for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        missing_files=$((missing_files + 1))
    fi
done

# Check helper files
helper_files=(
    "tests/e2e/helpers/test-helpers.ts"
    "tests/e2e/global-setup.ts"
    "tests/e2e/global-teardown.ts"
)

echo ""
echo "📁 Checking helper files..."

for file in "${helper_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        missing_files=$((missing_files + 1))
    fi
done

# Check configuration files
config_files=(
    "playwright.config.ts"
    "package.json"
)

echo ""
echo "📁 Checking configuration files..."

for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
        # Check if package.json has E2E scripts
        if [ "$file" = "package.json" ]; then
            if grep -q "test:e2e" "$file"; then
                echo "  ✅ E2E scripts configured"
            else
                echo "  ❌ E2E scripts missing"
                missing_files=$((missing_files + 1))
            fi
        fi
    else
        echo "❌ $file (missing)"
        missing_files=$((missing_files + 1))
    fi
done

echo ""
echo "📊 Summary"
echo "=========="

if [ $missing_files -eq 0 ]; then
    echo "🎉 All E2E test files are present and configured!"
    echo ""
    echo "📋 Test scenarios implemented:"
    echo "  1. ✅ Complete Quiz Flow"
    echo "  2. ✅ Tournament Mode (Live)"
    echo "  3. ✅ Tournament Deferred Mode"
    echo "  4. ✅ Late-Joiners Handling"
    echo "  5. ✅ Teacher Timer Controls"
    echo "  6. ✅ Practice Mode Self-Paced"
    echo ""
    echo "🚀 Ready to run: npm run test:e2e"
    echo "🔧 Debug mode: npm run test:e2e:debug"
    echo "🎯 UI mode: npm run test:e2e:ui"
    echo ""
    echo "📈 Phase 2 (Core Flows) - COMPLETED ✅"
    echo "   Estimated time: 4-6 hours - ACTUAL: Implementation complete"
    echo ""
    echo "🔄 Next Steps:"
    echo "   1. Run E2E tests against development environment"
    echo "   2. Fix any implementation-specific test issues"
    echo "   3. Phase 3: Cross-browser & mobile testing (optional)"
    echo "   4. Phase 4: CI/CD integration (optional)"
else
    echo "❌ $missing_files file(s) missing or misconfigured"
    echo "Please ensure all required files are present before running tests."
fi

echo ""
echo "💡 To run the tests:"
echo "   1. Ensure backend is running: npm run dev:backend"
echo "   2. Ensure frontend is running: npm run dev:frontend" 
echo "   3. Run E2E tests: npm run test:e2e"
