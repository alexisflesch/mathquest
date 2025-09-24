import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const outputFile = '.jest-results.json';

console.log('Running tests...');

const progressChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let progressIndex = 0;

// Show spinning progress indicator
const progressInterval = setInterval(() => {
    process.stdout.write(`\r${progressChars[progressIndex]} Running tests...`);
    progressIndex = (progressIndex + 1) % progressChars.length;
}, 100);

const child = spawn('npm', ['test', '--', '--json', `--outputFile=${outputFile}`, '--silent'], {
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
    process.stdout.write('\r' + ' '.repeat(30) + '\r'); // Clear progress line

    if (!fs.existsSync(outputFile)) {
        console.error(`Jest output file not found: ${outputFile}`);
        process.exit(1);
    }

    let results;
    try {
        const txt = fs.readFileSync(outputFile, 'utf8');
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

    console.log('Test Summary:');
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

    fs.unlinkSync(outputFile);
    process.exit(code);
});