#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'backend'; // Default to backend

// Validate test type
const validTypes = ['backend', 'frontend', 'e2e'];
if (!validTypes.includes(testType)) {
    console.error(`Invalid test type: ${testType}`);
    console.error(`Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
}

// Configure test commands based on type
let testCommand, testArgs, cwd;
switch (testType) {
    case 'backend':
        testCommand = 'npm';
        testArgs = ['test', '--', '--json', '--outputFile=../test-results/backend-jest-results.json', '--silent'];
        cwd = path.join(process.cwd(), 'backend');
        break;
    case 'frontend':
        testCommand = 'npm';
        testArgs = ['test', '--', '--json', '--outputFile=../test-results/frontend-jest-results.json', '--silent'];
        cwd = path.join(process.cwd(), 'frontend');
        break;
    case 'e2e':
        testCommand = 'npx';
        testArgs = ['playwright', 'test', '--reporter=json'];
        cwd = process.cwd();
        break;
}

const outputFile = testType === 'e2e' ? 'test-results/e2e-results.json' : `test-results/${testType}-jest-results.json`;

console.log(`Running ${testType} tests...\n`);

const progressChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let progressIndex = 0;

// Show spinning progress indicator
const progressInterval = setInterval(() => {
    process.stdout.write(`\r${progressChars[progressIndex]} Running ${testType} tests...`);
    progressIndex = (progressIndex + 1) % progressChars.length;
}, 100);

const child = spawn(testCommand, testArgs, {
    cwd,
    stdio: ['inherit', 'pipe', 'pipe']
});

let allOutput = '';

child.stdout.on('data', (data) => {
    allOutput += data.toString();
});

child.stderr.on('data', (data) => {
    allOutput += data.toString();
});

child.on('close', (code) => {
    clearInterval(progressInterval);
    process.stdout.write('\r' + ' '.repeat(40) + '\r'); // Clear progress line

    if (testType !== 'e2e' && !fs.existsSync(path.join(cwd, outputFile))) {
        console.error(`Test output file not found: ${outputFile}`);
        process.exit(1);
    }

    if (testType === 'e2e') {
        // Handle Playwright results
        handlePlaywrightResults(code, allOutput);
    } else {
        // Handle Jest results
        handleJestResults(code, allOutput, cwd);
    }
});

function handleJestResults(code, allOutput, cwd) {
    let results;
    try {
        const txt = fs.readFileSync(path.join(cwd, outputFile), 'utf8');
        results = JSON.parse(txt);
    } catch (e) {
        console.error(`Failed to read/parse ${outputFile}:`, e.message || e);
        process.exit(1);
    }

    // Show final Jest summary from the captured output
    const summaryLines = allOutput.split('\n').filter(line =>
        line.includes('Test Suites:') ||
        line.includes('Tests:') ||
        line.includes('Time:')
    );

    console.log(`${testType.toUpperCase()} Test Summary:`);
    summaryLines.forEach(line => console.log('  ' + line.trim()));

    const toRel = (p) => {
        try { return path.relative(process.cwd(), p); } catch { return p; }
    };

    const passed = new Set();
    const failed = new Set();

    for (const tr of results.testResults || []) {
        const name = toRel(tr.name || tr.testFilePath || '');
        if (!name) continue;
        if (tr.status === 'passed') passed.add(name);
        else if (tr.status === 'failed') failed.add(name);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Passed:');
    if (passed.size === 0) {
        console.log('  (none)');
    } else {
        [...passed].sort().forEach(f => console.log('  ' + f));
    }

    console.log('\n❌ Failed:');
    if (failed.size === 0) {
        console.log('  (none)');
    } else {
        [...failed].sort().forEach(f => console.log('  ' + f));
    }

    fs.unlinkSync(path.join(cwd, outputFile));
    process.exit(code);
}

function handlePlaywrightResults(code, allOutput) {
    // Parse Playwright JSON output
    let results = [];
    try {
        // Try to find JSON in the output
        const jsonMatch = allOutput.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
            results = JSON.parse(jsonMatch[1]);
        }
    } catch (e) {
        // Fallback: parse from file if it exists
        try {
            if (fs.existsSync(outputFile)) {
                const txt = fs.readFileSync(outputFile, 'utf8');
                results = JSON.parse(txt);
            }
        } catch (fileError) {
            console.error('Failed to parse Playwright results');
        }
    }

    // Extract test results
    const passed = new Set();
    const failed = new Set();

    if (results && Array.isArray(results)) {
        results.forEach(suite => {
            if (suite.specs) {
                suite.specs.forEach(spec => {
                    if (spec.tests) {
                        spec.tests.forEach(test => {
                            const testName = `${spec.title} > ${test.title}`;
                            if (test.results && test.results[0]) {
                                const result = test.results[0];
                                if (result.status === 'passed') {
                                    passed.add(testName);
                                } else if (result.status === 'failed') {
                                    failed.add(testName);
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    // Show summary from output
    const summaryLines = allOutput.split('\n').filter(line =>
        line.includes('tests passed') ||
        line.includes('tests failed') ||
        line.includes('Duration:')
    );

    console.log('E2E Test Summary:');
    if (summaryLines.length > 0) {
        summaryLines.forEach(line => console.log('  ' + line.trim()));
    } else {
        console.log(`  Exit code: ${code}`);
        console.log(`  Passed: ${passed.size}`);
        console.log(`  Failed: ${failed.size}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Passed:');
    if (passed.size === 0) {
        console.log('  (none)');
    } else {
        [...passed].sort().forEach(f => console.log('  ' + f));
    }

    console.log('\n❌ Failed:');
    if (failed.size === 0) {
        console.log('  (none)');
    } else {
        [...failed].sort().forEach(f => console.log('  ' + f));
    }

    // Clean up output file if it exists
    try {
        if (fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile);
        }
    } catch (e) {
        // Ignore cleanup errors
    }

    process.exit(code);
}