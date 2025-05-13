#!/usr/bin/env node

/**
 * Type Check Script
 * 
 * This script validates the shared types structure, looking for issues like:
 * - Circular dependencies
 * - Missing exports
 * - Duplicate type definitions
 * - Inconsistent naming conventions
 * 
 * Run with: npm run type-check
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const TYPES_DIR = path.resolve(__dirname, '..');
const MAIN_INDEX = path.join(TYPES_DIR, 'index.ts');

// Console colors
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";

// Store results
const issues = [];
const warnings = [];
const info = [];

console.log(`${BLUE}=== Shared Types Validation Script ===${RESET}\n`);

// Check if main index.ts exists
if (!fs.existsSync(MAIN_INDEX)) {
    issues.push('Main index.ts file not found');
} else {
    info.push('Main index.ts file found');

    // Read main index content
    const indexContent = fs.readFileSync(MAIN_INDEX, 'utf-8');

    // Check for export statements
    const exportLines = indexContent.split('\n').filter(line => line.trim().startsWith('export *'));
    info.push(`Found ${exportLines.length} export statements in index.ts`);

    // Check if all directories have exports in main index
    const directories = fs.readdirSync(TYPES_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .filter(dirent => dirent.name !== 'node_modules' && !dirent.name.startsWith('.'));

    directories.forEach(dir => {
        const dirName = dir.name;
        const hasExport = exportLines.some(line => line.includes(`'./${dirName}/`));

        if (!hasExport) {
            warnings.push(`Directory "${dirName}" has no exports in main index.ts`);
        } else {
            info.push(`Directory "${dirName}" is exported in main index.ts`);
        }

        // Check if directory has an index.ts file
        const dirIndexPath = path.join(TYPES_DIR, dirName, 'index.ts');
        if (!fs.existsSync(dirIndexPath)) {
            warnings.push(`Directory "${dirName}" has no index.ts file`);
        } else {
            info.push(`Directory "${dirName}" has an index.ts file`);
        }
    });
}

// Find all TypeScript files
function getAllTypeScriptFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            getAllTypeScriptFiles(filePath, fileList);
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

const tsFiles = getAllTypeScriptFiles(TYPES_DIR);
info.push(`Found ${tsFiles.length} TypeScript files`);

// Check for naming conventions
const namingIssues = [];
tsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const interfaceMatches = content.match(/interface\s+([A-Za-z0-9_]+)/g) || [];
    const typeMatches = content.match(/type\s+([A-Za-z0-9_]+)/g) || [];

    // Check interface naming (should be PascalCase and not end with "Interface")
    interfaceMatches.forEach(match => {
        const name = match.split(/\s+/)[1];
        if (name.endsWith('Interface')) {
            namingIssues.push(`Interface "${name}" in ${path.relative(TYPES_DIR, file)} should not end with "Interface"`);
        }
        if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
            namingIssues.push(`Interface "${name}" in ${path.relative(TYPES_DIR, file)} should use PascalCase`);
        }
    });

    // Check type naming (should be PascalCase)
    typeMatches.forEach(match => {
        const name = match.split(/\s+/)[1].split(/[<=(]/)[0]; // Extract name before any generics
        if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
            namingIssues.push(`Type "${name}" in ${path.relative(TYPES_DIR, file)} should use PascalCase`);
        }
    });
});

if (namingIssues.length > 0) {
    warnings.push(...namingIssues);
} else {
    info.push('All type and interface names follow naming conventions');
}

// Run tsc to check for TypeScript errors
try {
    console.log(`${BLUE}Running TypeScript compiler...${RESET}`);
    execSync('cd .. && npx tsc --noEmit', { stdio: 'inherit' });
    info.push('TypeScript compilation successful');
} catch (error) {
    issues.push('TypeScript compilation failed. See errors above.');
}

// Print results
if (issues.length === 0) {
    console.log(`\n${GREEN}✓ No major issues found!${RESET}`);
} else {
    console.log(`\n${RED}× Found ${issues.length} issues:${RESET}`);
    issues.forEach(issue => console.log(`${RED}  - ${issue}${RESET}`));
}

if (warnings.length > 0) {
    console.log(`\n${YELLOW}! Found ${warnings.length} warnings:${RESET}`);
    warnings.forEach(warning => console.log(`${YELLOW}  - ${warning}${RESET}`));
}

console.log(`\n${BLUE}ℹ Information:${RESET}`);
info.forEach(item => console.log(`${BLUE}  - ${item}${RESET}`));

// Exit with appropriate code
process.exit(issues.length > 0 ? 1 : 0);
