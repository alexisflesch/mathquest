#!/usr/bin/env node

const { Project } = require('ts-morph');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
console.log(`🔍 Project root: ${projectRoot}`);

// Try different tsconfig files
const tsConfigs = [
    'tsconfig.json',
    'tsconfig.base.json',
    'backend/tsconfig.json',
    'frontend/tsconfig.json',
    'shared/tsconfig.json'
];

for (const tsConfigFile of tsConfigs) {
    const tsConfigPath = path.join(projectRoot, tsConfigFile);
    console.log(`\n📋 Checking tsconfig at: ${tsConfigPath}`);

    if (!fs.existsSync(tsConfigPath)) {
        console.log(`❌ Not found`);
        continue;
    }

    console.log(`✅ Found: ${tsConfigFile}`);

    try {
        const tsConfigContent = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
        console.log(`📄 Files: ${JSON.stringify(tsConfigContent.files || 'not specified')}`);
        console.log(`📁 Include: ${JSON.stringify(tsConfigContent.include || 'not specified')}`);
        console.log(`🚫 Exclude: ${JSON.stringify(tsConfigContent.exclude || 'not specified')}`);

        if (tsConfigContent.references) {
            console.log(`🔗 References: ${tsConfigContent.references.length} project(s)`);
        }
    } catch (e) {
        console.log(`❌ Error reading config: ${e.message}`);
    }
}

// Try loading without tsconfig
console.log(`\n🔧 Trying to load project without specific tsconfig...`);

try {
    const project = new Project({
        compilerOptions: {
            target: "ES2020",
            module: "commonjs",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true
        }
    });

    // Manually add source files from different directories
    const dirs = ['shared', 'backend/src', 'frontend/src'];

    for (const dir of dirs) {
        const dirPath = path.join(projectRoot, dir);
        if (fs.existsSync(dirPath)) {
            console.log(`\n📂 Adding files from: ${dir}`);
            try {
                project.addSourceFilesAtPaths(`${dirPath}/**/*.ts`);
                const filesAdded = project.getSourceFiles().length;
                console.log(`✅ Total files in project now: ${filesAdded}`);
            } catch (e) {
                console.log(`❌ Error adding files from ${dir}: ${e.message}`);
            }
        }
    }

    const allFiles = project.getSourceFiles();
    console.log(`\n📊 Final count: ${allFiles.length} source files`);

    if (allFiles.length > 0) {
        // Analyze first few files for interfaces
        console.log(`\n🔍 Analyzing interfaces in first 10 files:`);

        let interfaceCount = 0;
        let typeAliasCount = 0;

        for (const file of allFiles.slice(0, 10)) {
            const interfaces = file.getInterfaces();
            const typeAliases = file.getTypeAliases();

            if (interfaces.length > 0 || typeAliases.length > 0) {
                console.log(`📄 ${path.relative(projectRoot, file.getFilePath())}`);
                console.log(`   - Interfaces: ${interfaces.length}`);
                console.log(`   - Type aliases: ${typeAliases.length}`);

                interfaces.forEach(iface => {
                    console.log(`     * Interface: ${iface.getName()}`);
                });
                typeAliases.forEach(alias => {
                    console.log(`     * Type: ${alias.getName()}`);
                });
            }

            interfaceCount += interfaces.length;
            typeAliasCount += typeAliases.length;
        }

        console.log(`\n📈 Total in first 10 files: ${interfaceCount} interfaces, ${typeAliasCount} type aliases`);

        // Count total interfaces across all files
        let totalInterfaces = 0;
        let totalTypeAliases = 0;

        for (const file of allFiles) {
            totalInterfaces += file.getInterfaces().length;
            totalTypeAliases += file.getTypeAliases().length;
        }

        console.log(`📈 Total across all files: ${totalInterfaces} interfaces, ${totalTypeAliases} type aliases`);
    }

} catch (error) {
    console.error('❌ Error:', error.message);
}
