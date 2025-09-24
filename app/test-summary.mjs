#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'backend'; // Default to backend
const testPattern = args[1] || ''; // Optional pattern to filter tests

// Validate test type
const validTypes = ['backend', 'frontend', 'e2e'];
if (!validTypes.includes(testType)) {
    console.error(`Invalid test type: ${testType}`);
    console.error(`Valid types: ${validTypes.join(', ')}`);
    console.error(`Usage: node test-summary.mjs <type> [pattern]`);
    console.error(`Examples:`);
    console.error(`  node test-summary.mjs backend`);
    console.error(`  node test-summary.mjs backend "tests/unit"`);
    console.error(`  node test-summary.mjs frontend "src/components/ui"`);
    console.error(`  node test-summary.mjs e2e "user registration"`);
    process.exit(1);
}

// Configure test commands based on type
let testCommand, testArgs, cwd;
switch (testType) {
    case 'backend':
        testCommand = 'npm';
        testArgs = ['test', '--', '--json', '--outputFile=../test-results/backend-jest-results.json', '--silent'];
        if (testPattern) {
            testArgs.push('--testPathPattern', testPattern);
        }
        cwd = path.join(process.cwd(), 'backend');
        break;
    case 'frontend':
        testCommand = 'npm';
        testArgs = ['test', '--', '--json', '--outputFile=../test-results/frontend-jest-results.json', '--silent'];
        if (testPattern) {
            testArgs.push('--testPathPattern', testPattern);
        }
        cwd = path.join(process.cwd(), 'frontend');
        break;
    case 'e2e':
        testCommand = 'npx';
        testArgs = ['playwright', 'test']; // Let config handle reporters
        if (testPattern) {
            testArgs.push('--grep', testPattern);
        }
        cwd = process.cwd();
        break;
}

const outputFile = testType === 'e2e' ? 'test-results/e2e-results.json' : `../test-results/${testType}-jest-results.json`;

console.log(`Running ${testType} tests...\n`);
console.log(`Command: ${testCommand} ${testArgs.join(' ')}`);
console.log(`CWD: ${cwd}`);
console.log(`Expected output file: ${path.join(cwd, outputFile)}`);
if (testPattern) {
    console.log(`Test pattern: ${testPattern}`);
}
console.log('');

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

child.on('close', async (code) => {
    clearInterval(progressInterval);
    process.stdout.write('\r' + ' '.repeat(40) + '\r'); // Clear progress line

    // Wait for Jest to finish writing the output file
    if (testType !== 'e2e') {
        let retries = 0;
        const maxRetries = 10;
        while (retries < maxRetries && !fs.existsSync(path.join(cwd, outputFile))) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
            retries++;
        }

        if (!fs.existsSync(path.join(cwd, outputFile))) {
            console.error(`Test output file not found after ${maxRetries} retries: ${outputFile}`);
            process.exit(1);
        }
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
    // Try to read Playwright JSON results from file first
    let results = null;
    try {
        const filePath = path.join(process.cwd(), outputFile);
        if (fs.existsSync(filePath)) {
            const txt = fs.readFileSync(filePath, 'utf8');
            if (txt.trim()) {
                results = JSON.parse(txt);
            }
        }
    } catch (e) {
        // JSON parsing failed, fall back to text parsing
    }

    // Extract test results
    const passed = new Set();
    const failed = new Set();

    if (results && Array.isArray(results)) {
        // Parse from JSON format
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
    } else {
        // Fallback: parse from text output
        const lines = allOutput.split('\n');

        // Look for test results in the output
        for (const line of lines) {
            // Look for test failure lines: "❌ Test failed: test-name" (legacy format)
            const failMatch = line.match(/❌ Test failed:\s*(.+)/);
            if (failMatch) {
                failed.add(failMatch[1].trim());
            }

            // Look for Playwright failure lines: "    [browser] › file:line:column › suite › test name"
            const playwrightFailMatch = line.match(/^\s*\[.*?\]\s*›\s*(.+?)\s*$/);
            if (playwrightFailMatch && line.includes('›')) {
                // Only add if this appears in a failure context (after "failed" but before next test or summary)
                const testName = playwrightFailMatch[1].trim();
                // Check if this line comes after a failure indicator
                const lineIndex = lines.indexOf(line);
                let isFailure = false;
                // Look backwards for failure indicators
                for (let i = lineIndex - 1; i >= 0 && i >= lineIndex - 5; i--) {
                    if (lines[i].includes('failed') || lines[i].includes('Error:')) {
                        isFailure = true;
                        break;
                    }
                }
                if (isFailure) {
                    failed.add(testName);
                }
            }
        }

        // Calculate passed tests from total - failed
        // Try different regex patterns for Playwright summary
        let totalMatch = allOutput.match(/(\d+)\s*passed,\s*(\d+)\s*failed/);
        if (!totalMatch) {
            totalMatch = allOutput.match(/(\d+)\s*passed\s*\(/);
        }
        if (totalMatch) {
            const totalPassed = parseInt(totalMatch[1]);
            // Add placeholder names for passed tests since we don't have individual names
            for (let i = 0; i < totalPassed; i++) {
                passed.add(`Test ${i + 1} (passed)`);
            }
        }
    }

    // Show summary from output
    const summaryLines = allOutput.split('\n').filter(line =>
        line.includes('passed') && line.includes('failed') ||
        line.includes('Duration:') ||
        line.includes('tests passed') ||
        line.includes('tests failed') ||
        line.match(/\d+ passed, \d+ failed/)
    );

    console.log('E2E Test Summary:');
    if (summaryLines.length > 0) {
        summaryLines.forEach(line => console.log('  ' + line.trim()));
    } else {
        // Fallback summary
        console.log(`  Exit code: ${code}`);
        console.log(`  Passed: ${passed.size}`);
        console.log(`  Failed: ${failed.size}`);

        // Try to extract some info from the output
        const runningMatch = allOutput.match(/Running (\d+) tests/);
        if (runningMatch) {
            console.log(`  Total tests found: ${runningMatch[1]}`);
        }

        const passedMatch = allOutput.match(/(\d+) passed/);
        const failedMatch = allOutput.match(/(\d+) failed/);
        if (passedMatch || failedMatch) {
            console.log(`  Tests completed: ${passedMatch ? passedMatch[1] : 0} passed, ${failedMatch ? failedMatch[1] : 0} failed`);
        }
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
        const filePath = path.join(process.cwd(), outputFile);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (e) {
        // Ignore cleanup errors
    }

    process.exit(code);
}