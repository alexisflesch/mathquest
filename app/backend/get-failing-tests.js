#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tempFile = path.join(__dirname, 'test-output.tmp');

try {
    // Run the tests and redirect output to a temporary file
    execSync(`npm test > ${tempFile} 2>&1`, {
        cwd: process.cwd()
    });

    // Read and parse the output file
    const output = fs.readFileSync(tempFile, 'utf8');
    parseAndOutputFailingTests(output);

} catch (error) {
    // Even if the command fails, try to read the output file
    try {
        const output = fs.readFileSync(tempFile, 'utf8');
        parseAndOutputFailingTests(output);
    } catch (readError) {
        console.error('Could not read test output');
        process.exit(1);
    }
} finally {
    // Clean up the temporary file
    try {
        fs.unlinkSync(tempFile);
    } catch (e) {
        // Ignore cleanup errors
    }
}

function parseAndOutputFailingTests(output) {
    const lines = output.split('\n');
    const failingTests = [];

    for (const line of lines) {
        // Look for lines that start with " FAIL " followed by test file path
        const match = line.match(/^ FAIL\s+(.+)$/);
        if (match) {
            failingTests.push(match[1].trim());
        }
    }

    // Output only the failing test file names, one per line
    failingTests.forEach(testFile => {
        console.log(testFile);
    });
}