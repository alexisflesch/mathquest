const fs = require('fs');
const path = require('path');

// Test to reproduce the _ref bug in service worker
const swPath = path.join(__dirname, '..', 'public', 'sw-v3.js');

if (!fs.existsSync(swPath)) {
    console.log('Service worker not found');
    process.exit(1);
}

const content = fs.readFileSync(swPath, 'utf8');

// Extract the cacheWillUpdate function that has _ref
const refMatch = content.match(/cacheWillUpdate:function\([^}]+\{return _ref\.apply\(this,arguments\)\}/);

if (!refMatch) {
    console.log('No _ref bug found in service worker');
    process.exit(0);
}

console.log('Found _ref bug in service worker');
console.log('Broken function:', refMatch[0]);

// Try to create a context where _ref is not defined and call the function
try {
    // Extract just the function body
    const funcStr = `function test() { ${refMatch[0]} }`;
    eval(funcStr);

    // Try to call it
    const mockResponse = { status: 200 };
    const result = test.call(null, { response: mockResponse });

    console.log('Function executed successfully:', result);
} catch (error) {
    console.log('Error reproduced:', error.message);
    console.log('This confirms the _ref bug exists');
}