#!/bin/bash

# Script to clean up backup files and temporary files
# Date: 2025-06-18
# Purpose: Remove backup files created during modernization

echo "🧹 Cleaning up backup files and temporary files..."

# List files to be removed for confirmation
echo ""
echo "📁 Files to be removed:"
echo "Backup files:"
echo "  - frontend/src/app/live/[code]/page-backup.tsx"
echo "  - frontend/src/app/lobby/[code]/page.tsx.backup"
echo "  - frontend/src/hooks/useTeacherQuizSocket.ts.backup"
echo "  - backend/src/sockets/handlers/projectorHandler.ts.backup"
echo "  - tests/e2e/practice-mode-backup.spec.ts.disabled"
echo ""
echo "Temporary files:"
echo "  - frontend/temp_tournament_timer_interface.txt"
echo "  - frontend/temp_conversion_helpers.txt"
echo ""
echo "Disabled files:"
echo "  - frontend/src/hooks/__tests__/usePracticeGameSocket.test.ts.disabled"
echo "  - frontend/src/hooks/usePracticeGameSocket.ts.disabled"
echo ""
echo "✅ Already archived:"
echo "  - NavbarStates/ → archive/frontend-components/NavbarStates-unused-2025-06-18/ (unused navigation system)"
echo "  - practice/session/ → archive/frontend-components/practice-session-page-unused-2025-06-18/ (obsolete practice page)"

echo ""
read -p "❓ Do you want to proceed with deletion? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing backup files..."
    
    # Remove backup files
    rm -f "frontend/src/app/live/[code]/page-backup.tsx"
    rm -f "frontend/src/app/lobby/[code]/page.tsx.backup"
    rm -f "frontend/src/hooks/useTeacherQuizSocket.ts.backup"
    rm -f "backend/src/sockets/handlers/projectorHandler.ts.backup"
    rm -f "tests/e2e/practice-mode-backup.spec.ts.disabled"
    
    # Remove temporary files
    rm -f "frontend/temp_tournament_timer_interface.txt"
    rm -f "frontend/temp_conversion_helpers.txt"
    
    # Remove disabled files
    rm -f "frontend/src/hooks/__tests__/usePracticeGameSocket.test.ts.disabled"
    rm -f "frontend/src/hooks/usePracticeGameSocket.ts.disabled"
    
    # Note: We need to remove the page_backup.tsx that was created today
    rm -f "frontend/src/app/student/practice/[accessCode]/page_backup.tsx"
    
    echo "✅ Cleanup completed!"
    echo ""
    echo "📊 Files removed:"
    echo "  - 5 backup files"
    echo "  - 2 temporary files"
    echo "  - 2 disabled files"
    echo "  - 1 practice page backup"
    echo "  Total: 10 files"
    echo ""
    echo "📁 Files archived:"
    echo "  - 5 NavbarStates components → archive/frontend-components/NavbarStates-unused-2025-06-18/"
    echo "  - 1 practice session page → archive/frontend-components/practice-session-page-unused-2025-06-18/"
    
else
    echo "❌ Cleanup cancelled."
fi
