const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'sw-v3.js');

if (!fs.existsSync(swPath)) {
    console.log('Service worker file not found, skipping fix');
    process.exit(0);
}

let content = fs.readFileSync(swPath, 'utf8');

// Remove the broken NetworkFirst registerRoute that contains _ref
const brokenRoute = /e\.registerRoute\("\/",new e\.NetworkFirst\(\{cacheName:"start-url",plugins:\[\{cacheWillUpdate:function\([^}]+\)\{return _ref\.apply\(this,arguments\)\}\}\]\}\),"GET"\),/g;

if (brokenRoute.test(content)) {
    content = content.replace(brokenRoute, '');
    fs.writeFileSync(swPath, content);
    console.log('Fixed service worker: removed broken NetworkFirst route');
} else {
    console.log('No broken route found in service worker');
}

// Validate syntax
try {
    new Function(content);
    console.log('Service worker syntax is valid');
} catch (error) {
    console.error('Service worker syntax error:', error.message);
    process.exit(1);
}