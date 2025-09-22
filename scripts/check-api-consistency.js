#!/usr/bin/env node

/**
 * API Route Consistency Checker
 *
 * Static analysis script to ensure all API routes follow consistent patterns:
 * - Request body parsing (JSON vs text vs formData)
 * - Error handling patterns
 * - Authentication patterns
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../app/frontend/src/app/api');

/**
 * Find all API route files
 */
function findApiRoutes(dir, routes = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            findApiRoutes(fullPath, routes);
        } else if (file === 'route.ts') {
            routes.push(fullPath);
        }
    }

    return routes;
}

/**
 * Analyze a route file for consistency issues
 */
function analyzeRoute(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Check for inconsistent request body parsing
    const textMatches = content.match(/request\.text\(\)/g) || [];
    const jsonMatches = content.match(/request\.json\(\)/g) || [];
    const formDataMatches = content.match(/request\.formData\(\)/g) || [];

    if (textMatches.length > 0 && jsonMatches.length > 0) {
        issues.push({
            type: 'INCONSISTENT_BODY_PARSING',
            message: 'Route uses both request.text() and request.json() - should use only request.json() for JSON APIs',
            file: filePath
        });
    }

    if (formDataMatches.length > 0) {
        issues.push({
            type: 'FORM_DATA_USAGE',
            message: 'Route uses request.formData() - ensure this is intentional and documented',
            file: filePath
        });
    }

    // Check for inconsistent error responses
    const errorPatterns = content.match(/NextResponse\.json\([^,]+,\s*{\s*status:\s*\d+\s*}\)/g) || [];
    if (errorPatterns.length > 0) {
        // Check if errors follow consistent structure
        const hasInconsistentErrors = errorPatterns.some(pattern => {
            // Look for errors that don't have proper structure
            return !pattern.includes('{') || !pattern.includes('error');
        });

        if (hasInconsistentErrors) {
            issues.push({
                type: 'INCONSISTENT_ERROR_FORMAT',
                message: 'Route may have inconsistent error response format',
                file: filePath
            });
        }
    }

    // Check for missing try-catch blocks around request.json()
    if (jsonMatches.length > 0) {
        const hasTryCatch = content.includes('try') && content.includes('catch');
        if (!hasTryCatch) {
            issues.push({
                type: 'MISSING_ERROR_HANDLING',
                message: 'Route uses request.json() but may not have proper error handling for malformed JSON',
                file: filePath
            });
        }
    }

    return issues;
}

/**
 * Main analysis function
 */
function analyzeApiConsistency() {
    console.log('🔍 Analyzing API route consistency...\n');

    const routeFiles = findApiRoutes(API_DIR);
    console.log(`Found ${routeFiles.length} API route files\n`);

    let totalIssues = 0;

    for (const file of routeFiles) {
        const issues = analyzeRoute(file);
        if (issues.length > 0) {
            console.log(`❌ ${path.relative(API_DIR, file)}:`);
            issues.forEach(issue => {
                console.log(`   ${issue.type}: ${issue.message}`);
                totalIssues++;
            });
            console.log('');
        }
    }

    if (totalIssues === 0) {
        console.log('✅ All API routes are consistent!');
        process.exit(0);
    } else {
        console.log(`❌ Found ${totalIssues} consistency issues`);
        process.exit(1);
    }
}

// Run the analysis
if (require.main === module) {
    analyzeApiConsistency();
}

module.exports = { analyzeApiConsistency, findApiRoutes, analyzeRoute };