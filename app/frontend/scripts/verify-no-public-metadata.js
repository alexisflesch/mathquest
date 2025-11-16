const fs = require('fs');
const path = require('path');

const publicMetadataDir = path.join(__dirname, '..', 'public', 'metadata');

if (fs.existsSync(publicMetadataDir)) {
    const items = fs.readdirSync(publicMetadataDir);
    if (items.length > 0) {
        console.error('\nERROR: Detected legacy frontend metadata in public/metadata.');
        console.error('This repository now uses the database taxonomy for metadata and does not include static metadata in public/metadata.');
        console.error('Please remove files from public/metadata before running a build.');
        console.error('\nFiles found:');
        items.forEach((i) => console.error(`  - ${i}`));
        process.exit(1);
    }
}
// No metadata folder or empty - ok
process.exit(0);
