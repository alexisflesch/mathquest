#!/usr/bin/env node

/**
 * Post-build script to fix the _ref bug in the generated service worker
 * 
 * The @ducanh2912/next-pwa library generates broken plugin code:
 *   {handlerDidError:function(e){return _ref.apply(this,arguments)}}
 * 
 * This script removes all instances of these broken plugins from the service worker.
 */

const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../public/sw.js');

console.log('Fixing service worker _ref bug...');

try {
    // Read the service worker file
    let content = fs.readFileSync(swPath, 'utf8');

    // Count occurrences before fix
    const beforeCount = (content.match(/_ref\.apply/g) || []).length;
    console.log(`Found ${beforeCount} _ref.apply occurrences`);

    // Remove all instances of the broken error handler plugin
    // Pattern 1: {handlerDidError:function(e){return _ref.apply(this,arguments)}}
    content = content.replace(
        /,?\{handlerDidError:function\([^)]*\)\{return _ref\.apply\(this,arguments\)\}\}/g,
        ''
    );

    // Pattern 2: {cacheWillUpdate:function(e){return _ref.apply(this,arguments)}}
    content = content.replace(
        /,?\{cacheWillUpdate:function\([^)]*\)\{return _ref\.apply\(this,arguments\)\}\}/g,
        ''
    );

    // Clean up any double commas that might result
    content = content.replace(/,,+/g, ',');

    // Clean up trailing commas in plugin arrays: [xxx,] -> [xxx]
    content = content.replace(/,\]/g, ']');

    // Count occurrences after fix
    const afterCount = (content.match(/_ref\.apply/g) || []).length;

    // Write back the fixed content
    fs.writeFileSync(swPath, content, 'utf8');

    console.log(`✓ Fixed! Removed ${beforeCount - afterCount} _ref.apply occurrences`);
    console.log(`  Service worker cleaned: ${swPath}`);

    if (afterCount > 0) {
        console.warn(`⚠ Warning: ${afterCount} _ref.apply occurrences still remain`);
    }
} catch (error) {
    console.error('Error fixing service worker:', error.message);
    process.exit(1);
}
