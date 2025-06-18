#!/usr/bin/env node

/**
 * TypeScript Interface Similarity Checker
 * 
 * Uses ts-morph to analyze TypeScript AST and detect:
 * - Locally defined interfaces that duplicate shared types
 * - Interfaces that could be unified or generalized
 * - Type definitions that should use canonical shared types
 */

const { Project } = require('ts-morph');
const path = require('path');
const fs = require('fs');

class InterfaceSimilarityChecker {
    constructor(rootPath = null) {
        // Load global configuration first
        this.loadGlobalConfig();

        // If no rootPath provided, auto-detect based on current working directory
        if (!rootPath) {
            // If we're in quality-monitor directory, go up one level to app
            if (__dirname.includes('quality-monitor')) {
                rootPath = path.resolve(__dirname, '../../..');
            } else {
                rootPath = path.resolve(__dirname, '../..');
            }
        }

        this.projectRoot = path.resolve(rootPath);
        console.log(`🔍 Project root: ${this.projectRoot}`);

        const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
        console.log(`📋 Looking for tsconfig at: ${tsConfigPath}`);

        if (!fs.existsSync(tsConfigPath)) {
            throw new Error(`TypeScript config not found at: ${tsConfigPath}`);
        }

        this.project = new Project({
            tsConfigFilePath: tsConfigPath,
        });

        this.sharedTypes = new Map();
        this.localInterfaces = new Map();
        this.duplicates = [];
        this.recommendations = [];
    }

    /**
     * Load global configuration from config file
     */
    loadGlobalConfig() {
        try {
            const configPath = path.resolve(__dirname, '../../config/global.json');
            if (fs.existsSync(configPath)) {
                const configContent = fs.readFileSync(configPath, 'utf8');
                this.globalConfig = JSON.parse(configContent);
            } else {
                console.warn('⚠️  Global config not found, using defaults');
                this.globalConfig = {};
            }
        } catch (error) {
            console.warn(`⚠️  Failed to load global config: ${error.message}`);
            this.globalConfig = {};
        }
    }

    /**
     * Main analysis entry point
     */
    async analyze() {
        console.log('🔍 Starting TypeScript Interface Similarity Analysis...\n');

        try {
            // Step 1: Load and catalog shared types
            await this.catalogSharedTypes();

            // Step 2: Scan local interfaces across modules
            await this.scanLocalInterfaces();

            // Step 3: Detect similarities and duplicates
            await this.detectSimilarities();

            // Step 4: Generate recommendations
            await this.generateRecommendations();

            // Step 5: Output results
            this.outputResults();

        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Catalog all shared types for comparison
     */
    async catalogSharedTypes() {
        console.log('📋 Cataloging shared types...');

        const sharedPath = path.join(this.projectRoot, 'shared');
        if (!fs.existsSync(sharedPath)) {
            console.warn('⚠️  No shared/ directory found');
            return;
        }

        const sourceFiles = this.project.getSourceFiles(`${sharedPath}/**/*.ts`);

        for (const sourceFile of sourceFiles) {
            const interfaces = sourceFile.getInterfaces();
            const typeAliases = sourceFile.getTypeAliases();

            for (const interface_ of interfaces) {
                this.sharedTypes.set(interface_.getName(), {
                    name: interface_.getName(),
                    file: sourceFile.getFilePath(),
                    properties: this.extractProperties(interface_),
                    node: interface_
                });
            }

            for (const typeAlias of typeAliases) {
                this.sharedTypes.set(typeAlias.getName(), {
                    name: typeAlias.getName(),
                    file: sourceFile.getFilePath(),
                    properties: this.extractTypeProperties(typeAlias),
                    node: typeAlias
                });
            }
        }

        console.log(`✅ Found ${this.sharedTypes.size} shared types\n`);
    }

    /**
     * Scan local interfaces in frontend/backend modules
     */
    async scanLocalInterfaces() {
        console.log('🔎 Scanning local interfaces...');

        const modules = ['frontend', 'backend'];

        for (const module of modules) {
            const modulePath = path.join(this.projectRoot, module);
            if (!fs.existsSync(modulePath)) continue;

            const sourceFiles = this.project.getSourceFiles(`${modulePath}/**/*.ts`);

            for (const sourceFile of sourceFiles) {
                // Skip test files and generated files
                if (this.shouldSkipFile(sourceFile.getFilePath())) continue;

                const interfaces = sourceFile.getInterfaces();
                const typeAliases = sourceFile.getTypeAliases();

                for (const interface_ of interfaces) {
                    const key = `${module}:${interface_.getName()}`;
                    this.localInterfaces.set(key, {
                        name: interface_.getName(),
                        module,
                        file: sourceFile.getFilePath(),
                        properties: this.extractProperties(interface_),
                        node: interface_
                    });
                }

                for (const typeAlias of typeAliases) {
                    const key = `${module}:${typeAlias.getName()}`;
                    this.localInterfaces.set(key, {
                        name: typeAlias.getName(),
                        module,
                        file: sourceFile.getFilePath(),
                        properties: this.extractTypeProperties(typeAlias),
                        node: typeAlias
                    });
                }
            }
        }

        console.log(`✅ Found ${this.localInterfaces.size} local interfaces\n`);
    }

    /**
     * Detect similarities between interfaces
     */
    async detectSimilarities() {
        console.log('⚡ Detecting similarities...');

        // Check local interfaces against shared types
        for (const [localKey, localInterface] of this.localInterfaces) {
            for (const [sharedKey, sharedType] of this.sharedTypes) {
                const similarity = this.calculateSimilarity(localInterface.properties, sharedType.properties);

                if (similarity.score >= 0.8) {
                    this.duplicates.push({
                        type: 'duplicate_shared',
                        local: localInterface,
                        shared: sharedType,
                        similarity: similarity.score,
                        details: similarity.details
                    });
                }
            }
        }

        // Check local interfaces against each other
        const localEntries = Array.from(this.localInterfaces.entries());
        for (let i = 0; i < localEntries.length; i++) {
            for (let j = i + 1; j < localEntries.length; j++) {
                const [key1, interface1] = localEntries[i];
                const [key2, interface2] = localEntries[j];

                const similarity = this.calculateSimilarity(interface1.properties, interface2.properties);

                if (similarity.score >= 0.7) {
                    this.duplicates.push({
                        type: 'duplicate_local',
                        interface1,
                        interface2,
                        similarity: similarity.score,
                        details: similarity.details
                    });
                }
            }
        }

        console.log(`✅ Found ${this.duplicates.length} potential duplicates\n`);
    }

    /**
     * Generate actionable recommendations
     */
    async generateRecommendations() {
        console.log('💡 Generating recommendations...');

        for (const duplicate of this.duplicates) {
            if (duplicate.type === 'duplicate_shared') {
                this.recommendations.push({
                    severity: 'high',
                    type: 'use_shared_type',
                    message: `Replace local interface '${duplicate.local.name}' with shared type '${duplicate.shared.name}'`,
                    localFile: duplicate.local.file,
                    sharedFile: duplicate.shared.file,
                    similarity: duplicate.similarity,
                    action: `Import ${duplicate.shared.name} from shared types instead of defining locally`
                });
            } else if (duplicate.type === 'duplicate_local') {
                this.recommendations.push({
                    severity: 'medium',
                    type: 'unify_interfaces',
                    message: `Unify similar interfaces '${duplicate.interface1.name}' and '${duplicate.interface2.name}'`,
                    file1: duplicate.interface1.file,
                    file2: duplicate.interface2.file,
                    similarity: duplicate.similarity,
                    action: 'Create a shared interface or use composition to reduce duplication'
                });
            }
        }

        console.log(`✅ Generated ${this.recommendations.length} recommendations\n`);
    }

    /**
     * Extract properties from an interface
     */
    extractProperties(interface_) {
        const properties = new Map();

        for (const prop of interface_.getProperties()) {
            properties.set(prop.getName(), {
                name: prop.getName(),
                type: prop.getTypeNodeOrThrow().getText(),
                optional: prop.hasQuestionToken()
            });
        }

        return properties;
    }

    /**
     * Extract properties from a type alias
     */
    extractTypeProperties(typeAlias) {
        const properties = new Map();
        const typeNode = typeAlias.getTypeNode();

        if (typeNode && typeNode.getKind() === 185) { // TypeLiteral
            for (const prop of typeNode.getProperties()) {
                if (prop.getKind() === 165) { // PropertySignature
                    properties.set(prop.getName(), {
                        name: prop.getName(),
                        type: prop.getTypeNode()?.getText() || 'unknown',
                        optional: prop.hasQuestionToken()
                    });
                }
            }
        }

        return properties;
    }

    /**
     * Calculate similarity between two property sets
     */
    calculateSimilarity(props1, props2) {
        const names1 = new Set(props1.keys());
        const names2 = new Set(props2.keys());

        const intersection = new Set([...names1].filter(name => names2.has(name)));
        const union = new Set([...names1, ...names2]);

        if (union.size === 0) return { score: 0, details: {} };

        const jaccardSimilarity = intersection.size / union.size;

        // Check type compatibility for matching properties
        let typeMatches = 0;
        for (const propName of intersection) {
            const prop1 = props1.get(propName);
            const prop2 = props2.get(propName);

            if (prop1.type === prop2.type && prop1.optional === prop2.optional) {
                typeMatches++;
            }
        }

        const typeCompatibility = intersection.size > 0 ? typeMatches / intersection.size : 0;
        const finalScore = (jaccardSimilarity * 0.7) + (typeCompatibility * 0.3);

        return {
            score: finalScore,
            details: {
                commonProperties: intersection.size,
                totalProperties: union.size,
                typeMatches,
                jaccardSimilarity,
                typeCompatibility
            }
        };
    }

    /**
     * Check if file should be skipped
     */
    shouldSkipFile(filePath) {
        const skipPatterns = [
            /\.test\.ts$/,
            /\.spec\.ts$/,
            /\.d\.ts$/,
            /node_modules/,
            /\.next/,
            /dist/,
            /build/
        ];

        return skipPatterns.some(pattern => pattern.test(filePath));
    }

    /**
     * Output analysis results
     */
    outputResults() {
        console.log('📊 INTERFACE SIMILARITY ANALYSIS RESULTS\n');
        console.log('='.repeat(50));

        if (this.recommendations.length === 0) {
            console.log('✅ No duplicate interfaces detected!');
            return;
        }

        // Group by severity
        const high = this.recommendations.filter(r => r.severity === 'high');
        const medium = this.recommendations.filter(r => r.severity === 'medium');

        if (high.length > 0) {
            console.log(`\n🔴 HIGH PRIORITY (${high.length} issues):`);
            high.forEach((rec, i) => {
                console.log(`${i + 1}. ${rec.message}`);
                console.log(`   File: ${path.relative(this.projectRoot, rec.localFile || rec.file1)}`);
                console.log(`   Similarity: ${(rec.similarity * 100).toFixed(1)}%`);
                console.log(`   Action: ${rec.action}\n`);
            });
        }

        if (medium.length > 0) {
            console.log(`\n🟡 MEDIUM PRIORITY (${medium.length} issues):`);
            medium.forEach((rec, i) => {
                console.log(`${i + 1}. ${rec.message}`);
                console.log(`   Files: ${path.relative(this.projectRoot, rec.file1)} & ${path.relative(this.projectRoot, rec.file2)}`);
                console.log(`   Similarity: ${(rec.similarity * 100).toFixed(1)}%`);
                console.log(`   Action: ${rec.action}\n`);
            });
        }

        console.log('='.repeat(50));
        console.log(`Total issues: ${this.recommendations.length}`);
        console.log(`Shared types available: ${this.sharedTypes.size}`);
        console.log(`Local interfaces scanned: ${this.localInterfaces.size}`);
    }
}

// CLI execution
if (require.main === module) {
    const checker = new InterfaceSimilarityChecker();
    checker.analyze().catch(console.error);
}

module.exports = InterfaceSimilarityChecker;
