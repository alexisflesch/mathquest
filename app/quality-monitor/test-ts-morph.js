#!/usr/bin/env node

const { Project } = require('ts-morph');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
console.log(`🔍 Project root: ${projectRoot}`);

const tsConfigPath = path.join(projectRoot, 'tsconfig.json');
console.log(`📋 Looking for tsconfig at: ${tsConfigPath}`);

if (!fs.existsSync(tsConfigPath)) {
    console.error(`❌ TypeScript config not found at: ${tsConfigPath}`);
    process.exit(1);
}

console.log('✅ tsconfig.json exists');

try {
    const project = new Project({
        tsConfigFilePath: tsConfigPath,
    });

    console.log('✅ Project created successfully');

    // Check if any source files are loaded
    const allSourceFiles = project.getSourceFiles();
    console.log(`📄 Total source files loaded: ${allSourceFiles.length}`);

    if (allSourceFiles.length > 0) {
        console.log('📂 First 5 source files:');
        allSourceFiles.slice(0, 5).forEach((file, i) => {
            console.log(`  ${i + 1}. ${file.getFilePath()}`);
        });
    }

    // Try to specifically get files from shared directory
    const sharedPath = path.join(projectRoot, 'shared');
    console.log(`\n🔍 Checking shared directory: ${sharedPath}`);
    console.log(`📁 Shared directory exists: ${fs.existsSync(sharedPath)}`);

    if (fs.existsSync(sharedPath)) {
        const sharedFiles = project.getSourceFiles(`${sharedPath}/**/*.ts`);
        console.log(`📄 Shared TypeScript files: ${sharedFiles.length}`);

        sharedFiles.forEach((file, i) => {
            const interfaces = file.getInterfaces();
            const typeAliases = file.getTypeAliases();
            console.log(`  ${i + 1}. ${file.getFilePath()}`);
            console.log(`     - Interfaces: ${interfaces.length}`);
            console.log(`     - Type aliases: ${typeAliases.length}`);
        });
    }

    // Try frontend directory
    const frontendPath = path.join(projectRoot, 'frontend');
    console.log(`\n🔍 Checking frontend directory: ${frontendPath}`);
    console.log(`📁 Frontend directory exists: ${fs.existsSync(frontendPath)}`);

    if (fs.existsSync(frontendPath)) {
        const frontendFiles = project.getSourceFiles(`${frontendPath}/**/*.ts`);
        console.log(`📄 Frontend TypeScript files: ${frontendFiles.length}`);

        // Show first few files with interfaces
        let count = 0;
        for (const file of frontendFiles) {
            if (count >= 5) break;
            const interfaces = file.getInterfaces();
            const typeAliases = file.getTypeAliases();
            if (interfaces.length > 0 || typeAliases.length > 0) {
                console.log(`  ${count + 1}. ${file.getFilePath()}`);
                console.log(`     - Interfaces: ${interfaces.length}`);
                console.log(`     - Type aliases: ${typeAliases.length}`);
                count++;
            }
        }
    }

    // Try backend directory
    const backendPath = path.join(projectRoot, 'backend');
    console.log(`\n🔍 Checking backend directory: ${backendPath}`);
    console.log(`📁 Backend directory exists: ${fs.existsSync(backendPath)}`);

    if (fs.existsSync(backendPath)) {
        const backendFiles = project.getSourceFiles(`${backendPath}/**/*.ts`);
        console.log(`📄 Backend TypeScript files: ${backendFiles.length}`);

        // Show first few files with interfaces
        let count = 0;
        for (const file of backendFiles) {
            if (count >= 5) break;
            const interfaces = file.getInterfaces();
            const typeAliases = file.getTypeAliases();
            if (interfaces.length > 0 || typeAliases.length > 0) {
                console.log(`  ${count + 1}. ${file.getFilePath()}`);
                console.log(`     - Interfaces: ${interfaces.length}`);
                console.log(`     - Type aliases: ${typeAliases.length}`);
                interfaces.forEach(iface => {
                    console.log(`       * Interface: ${iface.getName()}`);
                });
                typeAliases.forEach(alias => {
                    console.log(`       * Type: ${alias.getName()}`);
                });
                count++;
            }
        }
    }

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
}
