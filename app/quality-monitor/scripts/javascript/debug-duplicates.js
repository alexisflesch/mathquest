#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Quick script to see what duplicate was found
const frontendPath = path.resolve(__dirname, '../../../frontend');
const lockfilePath = path.join(frontendPath, 'package-lock.json');

if (fs.existsSync(lockfilePath)) {
    const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
    const packageVersions = {};

    const collectPackages = (dependencies, depth = 0) => {
        if (!dependencies || depth > 10) return;
        
        for (const [name, info] of Object.entries(dependencies)) {
            if (!packageVersions[name]) {
                packageVersions[name] = new Set();
            }
            if (info.version) {
                packageVersions[name].add(info.version);
            }
            
            if (info.dependencies) {
                collectPackages(info.dependencies, depth + 1);
            }
        }
    };

    if (lockfile.dependencies) {
        collectPackages(lockfile.dependencies);
    }

    // Find duplicates
    const duplicates = Object.entries(packageVersions)
        .filter(([name, versions]) => versions.size > 1)
        .map(([name, versions]) => ({
            package: name,
            versions: Array.from(versions),
            count: versions.size
        }));

    console.log('🔍 Duplicate packages found:');
    duplicates.forEach(dup => {
        console.log(`📦 ${dup.package}:`);
        console.log(`   Versions: ${dup.versions.join(', ')}`);
        console.log(`   Count: ${dup.count}`);
        console.log('');
    });

    if (duplicates.length === 0) {
        console.log('✅ No duplicates found');
    }
} else {
    console.log('❌ package-lock.json not found');
}
