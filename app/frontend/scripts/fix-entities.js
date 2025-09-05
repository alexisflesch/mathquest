#!/usr/bin/env node

/**
 * Script to fix unescaped entities in React/JSX files
 * Uses npm run build output to only fix actual ESLint errors
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Define replacements for unescaped entities
const REPLACEMENTS = {
    "'": "&apos;",        // Regular apostrophe/single quote
    '"': "&quot;",        // Regular double quote
    "\u2019": "&apos;",   // Right single quotation mark (curly)
    "\u2018": "&apos;",   // Left single quotation mark (curly)  
    "\u201C": "&quot;",   // Left double quotation mark (curly)
    "\u201D": "&quot;",   // Right double quotation mark (curly)
    "\u2026": "&hellip;", // Horizontal ellipsis
    "\u2013": "&ndash;",  // En dash
    "\u2014": "&mdash;",  // Em dash
};

function parseBuildOutput() {
    console.log('🔍 Running npm run build to detect unescaped entity errors...\n');

    let buildOutput;
    try {
        // Run build and capture output (it will fail, but we want the ESLint output)
        execSync('npm run build', { encoding: 'utf-8', stdio: 'pipe' });
        return []; // If build succeeds, no errors to fix
    } catch (error) {
        buildOutput = error.stdout + error.stderr;
    }

    const errors = [];
    const lines = buildOutput.split('\n');
    let currentFile = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this is a file path line (starts with ./ and ends with known extensions)
        if (line.match(/^\.\/.*\.(tsx?|jsx?)$/)) {
            currentFile = line.replace('./', '');
            continue;
        }

        // Look for react/no-unescaped-entities errors
        if (line.includes('react/no-unescaped-entities') && currentFile) {
            // Format: 123:45  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
            const match = line.match(/^(\d+):(\d+)\s+Error:\s*`(.)`\s+can be escaped/);
            if (match) {
                const [, lineNum, colNum, character] = match;
                errors.push({
                    file: currentFile,
                    line: parseInt(lineNum),
                    column: parseInt(colNum),
                    rule: 'react/no-unescaped-entities',
                    message: line,
                    character
                });
                console.log(`� Found error: ${character} at line ${lineNum} in ${currentFile}`);
            }
        }
    }

    return errors;
}

function fixSpecificError(error) {
    try {
        const filePath = error.file;
        console.log(`🔧 Fixing ${error.character} at line ${error.line} in ${path.basename(filePath)}`);

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        if (error.line > lines.length) {
            console.log(`  ⚠️  Line ${error.line} not found in file`);
            return false;
        }

        const lineContent = lines[error.line - 1]; // Convert to 0-based index
        const character = error.character;

        if (!character || !REPLACEMENTS[character]) {
            console.log(`  ⚠️  No replacement found for character: ${character}`);
            return false;
        }

        // Replace the character in this specific line
        const replacement = REPLACEMENTS[character];
        const newLineContent = lineContent.replace(character, replacement);

        if (newLineContent === lineContent) {
            console.log(`  ⚠️  Character not found in line: ${lineContent.trim()}`);
            return false;
        }

        lines[error.line - 1] = newLineContent;
        const newContent = lines.join('\n');

        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`  ✅ Fixed '${character}' → '${replacement}'`);
        return true;

    } catch (err) {
        console.error(`  ❌ Error fixing ${error.file}:`, err);
        return false;
    }
}

async function main() {
    console.log('🔧 Fixing unescaped entities based on ESLint errors...\n');

    // Parse build output to get actual errors
    const errors = parseBuildOutput();

    if (errors.length === 0) {
        console.log('✅ No unescaped entity errors found in build output!');
        return;
    }

    console.log(`📋 Found ${errors.length} unescaped entity errors to fix:\n`);

    let fixedCount = 0;
    for (const error of errors) {
        if (fixSpecificError(error)) {
            fixedCount++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Errors found: ${errors.length}`);
    console.log(`   Errors fixed: ${fixedCount}`);

    if (fixedCount > 0) {
        console.log(`\n✨ Fixed ${fixedCount} unescaped entity errors!`);
        console.log(`\n🔄 Run 'npm run build' again to verify fixes.`);
    }
}

main().catch(console.error);
