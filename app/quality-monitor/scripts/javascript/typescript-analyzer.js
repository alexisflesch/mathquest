#!/usr/bin/env node

/**
 * TypeScript Analyzer - Detects TypeScript-specific code quality issues
 * 
 * This script analyzes TypeScript files for:
 * - Excessive 'any' type usage
 * - Type assertions/casting
 * - Implicit any usage
 * - Type definition duplication
 * - Missing return types
 * - Non-null assertions
 * - Type guards usage
 * - Interface vs type alias consistency
 * 
 * Usage: node typescript-analyzer.js [project-root]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TypeScriptAnalyzer {
    constructor(projectRoot = null) {
        // Load global configuration
        this.loadGlobalConfig();

        // Auto-detect project root if not provided
        if (!projectRoot) {
            if (__dirname.includes('quality-monitor')) {
                projectRoot = path.resolve(__dirname, '../../..');
            } else {
                projectRoot = path.resolve(__dirname, '../..');
            }
        }

        this.projectRoot = path.resolve(projectRoot);
        console.log(`🔍 TypeScript Analyzer - Project root: ${this.projectRoot}`);

        this.results = {
            summary: {
                totalFiles: 0,
                totalIssues: 0,
                analyzedAt: new Date().toISOString(),
                projectRoot: this.projectRoot
            },
            issues: {
                anyUsage: [],
                typeAssertions: [],
                implicitAny: [],
                missingReturnTypes: [],
                nonNullAssertions: [],
                duplicateTypes: [],
                inconsistentTypeDefinitions: []
            },
            statistics: {
                anyUsageCount: 0,
                typeAssertionCount: 0,
                implicitAnyCount: 0,
                missingReturnTypeCount: 0,
                nonNullAssertionCount: 0,
                duplicateTypeCount: 0
            },
            recommendations: []
        };

        this.typeDefinitions = new Map(); // Track type definitions for duplication detection
        this.interfaceDefinitions = new Map();
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
     * Find all TypeScript files in the project
     */
    findTypeScriptFiles() {
        const tsFiles = [];
        const excludePatterns = [
            'node_modules',
            '.git',
            'dist',
            'build',
            'coverage',
            '.next',
            'playwright-report',
            'test-results'
        ];

        const walkDir = (dir) => {
            try {
                const files = fs.readdirSync(dir);

                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);

                    if (stat.isDirectory()) {
                        const shouldExclude = excludePatterns.some(pattern =>
                            filePath.includes(pattern) || file.startsWith('.')
                        );

                        if (!shouldExclude) {
                            walkDir(filePath);
                        }
                    } else if (file.match(/\.(ts|tsx)$/) && !file.match(/\.d\.ts$/)) {
                        tsFiles.push(filePath);
                    }
                }
            } catch (error) {
                console.warn(`Warning: Could not read directory ${dir}: ${error.message}`);
            }
        };

        walkDir(this.projectRoot);
        return tsFiles;
    }

    /**
     * Analyze a single TypeScript file
     */
    analyzeFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(this.projectRoot, filePath);

            // Analyze different TypeScript issues
            this.analyzeAnyUsage(content, relativePath);
            this.analyzeTypeAssertions(content, relativePath);
            this.analyzeImplicitAny(content, relativePath);
            this.analyzeMissingReturnTypes(content, relativePath);
            this.analyzeNonNullAssertions(content, relativePath);
            this.analyzeTypeDefinitions(content, relativePath);

        } catch (error) {
            console.warn(`Warning: Could not analyze file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Analyze 'any' type usage
     */
    analyzeAnyUsage(content, filePath) {
        const lines = content.split('\n');
        const anyRegex = /\b(:\s*any\b|<any>|as\s+any\b|any\[\]|Array<any>)/g;

        lines.forEach((line, index) => {
            // Skip comments and strings
            if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

            let match;
            while ((match = anyRegex.exec(line)) !== null) {
                this.results.issues.anyUsage.push({
                    file: filePath,
                    line: index + 1,
                    column: match.index + 1,
                    match: match[0].trim(),
                    context: line.trim(),
                    severity: 'medium',
                    suggestion: 'Consider using specific types instead of any'
                });
                this.results.statistics.anyUsageCount++;
            }
        });
    }

    /**
     * Analyze type assertions and casting
     */
    analyzeTypeAssertions(content, filePath) {
        const lines = content.split('\n');
        const assertionRegex = /(as\s+\w+|<\w+>)/g;

        lines.forEach((line, index) => {
            // Skip comments
            if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

            let match;
            while ((match = assertionRegex.exec(line)) !== null) {
                this.results.issues.typeAssertions.push({
                    file: filePath,
                    line: index + 1,
                    column: match.index + 1,
                    match: match[0].trim(),
                    context: line.trim(),
                    severity: 'low',
                    suggestion: 'Consider type guards or proper typing instead of assertions'
                });
                this.results.statistics.typeAssertionCount++;
            }
        });
    }

    /**
     * Analyze implicit any usage (parameters without types)
     */
    analyzeImplicitAny(content, filePath) {
        const lines = content.split('\n');
        // Look for function parameters without type annotations
        const implicitAnyRegex = /function\s+\w+\s*\(([^)]*)\)|(\w+)\s*\(([^)]*)\)\s*=>/g;

        lines.forEach((line, index) => {
            // Skip comments and type definitions
            if (line.trim().startsWith('//') || line.trim().startsWith('*') ||
                line.includes('interface') || line.includes('type ')) return;

            let match;
            while ((match = implicitAnyRegex.exec(line)) !== null) {
                const params = match[1] || match[3] || '';
                // Check if parameters lack type annotations
                if (params && !params.includes(':') && params.trim() !== '') {
                    this.results.issues.implicitAny.push({
                        file: filePath,
                        line: index + 1,
                        column: match.index + 1,
                        match: match[0].trim(),
                        context: line.trim(),
                        severity: 'medium',
                        suggestion: 'Add explicit type annotations to function parameters'
                    });
                    this.results.statistics.implicitAnyCount++;
                }
            }
        });
    }

    /**
     * Analyze missing return types
     */
    analyzeMissingReturnTypes(content, filePath) {
        const lines = content.split('\n');
        // Look for functions without return type annotations
        const functionRegex = /(function\s+\w+\s*\([^)]*\)\s*\{|(\w+)\s*\([^)]*\)\s*=>\s*\{|(\w+)\s*\([^)]*\)\s*\{)/g;

        lines.forEach((line, index) => {
            // Skip comments, interfaces, and already typed functions
            if (line.trim().startsWith('//') || line.trim().startsWith('*') ||
                line.includes('interface') || line.includes('):')) return;

            let match;
            while ((match = functionRegex.exec(line)) !== null) {
                // Skip if it already has a return type
                if (line.includes('):') || line.includes('=> void') ||
                    line.includes('constructor') || line.includes('get ') ||
                    line.includes('set ')) continue;

                this.results.issues.missingReturnTypes.push({
                    file: filePath,
                    line: index + 1,
                    column: match.index + 1,
                    match: match[0].trim(),
                    context: line.trim(),
                    severity: 'low',
                    suggestion: 'Consider adding explicit return type annotation'
                });
                this.results.statistics.missingReturnTypeCount++;
            }
        });
    }

    /**
     * Analyze non-null assertions
     */
    analyzeNonNullAssertions(content, filePath) {
        const lines = content.split('\n');
        const nonNullRegex = /\w+!/g;

        lines.forEach((line, index) => {
            // Skip comments
            if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

            let match;
            while ((match = nonNullRegex.exec(line)) !== null) {
                // Make sure it's actually a non-null assertion, not just an exclamation
                if (match.index > 0 && /\w/.test(content[match.index - 1])) {
                    this.results.issues.nonNullAssertions.push({
                        file: filePath,
                        line: index + 1,
                        column: match.index + 1,
                        match: match[0].trim(),
                        context: line.trim(),
                        severity: 'medium',
                        suggestion: 'Consider proper null checking instead of non-null assertion'
                    });
                    this.results.statistics.nonNullAssertionCount++;
                }
            }
        });
    }

    /**
     * Analyze type definitions for duplication and consistency
     */
    analyzeTypeDefinitions(content, filePath) {
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            // Look for interface definitions
            const interfaceMatch = line.match(/interface\s+(\w+)/);
            if (interfaceMatch) {
                const interfaceName = interfaceMatch[1];
                if (this.interfaceDefinitions.has(interfaceName)) {
                    this.results.issues.duplicateTypes.push({
                        file: filePath,
                        line: index + 1,
                        type: 'interface',
                        name: interfaceName,
                        context: line.trim(),
                        severity: 'high',
                        suggestion: `Duplicate interface ${interfaceName} found`,
                        originalLocation: this.interfaceDefinitions.get(interfaceName)
                    });
                    this.results.statistics.duplicateTypeCount++;
                } else {
                    this.interfaceDefinitions.set(interfaceName, { file: filePath, line: index + 1 });
                }
            }

            // Look for type alias definitions
            const typeMatch = line.match(/type\s+(\w+)\s*=/);
            if (typeMatch) {
                const typeName = typeMatch[1];
                if (this.typeDefinitions.has(typeName)) {
                    this.results.issues.duplicateTypes.push({
                        file: filePath,
                        line: index + 1,
                        type: 'type',
                        name: typeName,
                        context: line.trim(),
                        severity: 'high',
                        suggestion: `Duplicate type ${typeName} found`,
                        originalLocation: this.typeDefinitions.get(typeName)
                    });
                    this.results.statistics.duplicateTypeCount++;
                } else {
                    this.typeDefinitions.set(typeName, { file: filePath, line: index + 1 });
                }
            }
        });
    }

    /**
     * Check if TypeScript compiler is available and get compiler diagnostics
     */
    getCompilerDiagnostics() {
        try {
            // Check for tsconfig.json files
            const tsconfigPaths = [];
            const findTsConfigs = (dir) => {
                try {
                    const files = fs.readdirSync(dir);
                    for (const file of files) {
                        const filePath = path.join(dir, file);
                        if (file === 'tsconfig.json') {
                            tsconfigPaths.push(filePath);
                        } else if (fs.statSync(filePath).isDirectory() &&
                            !file.includes('node_modules') && !file.startsWith('.')) {
                            findTsConfigs(filePath);
                        }
                    }
                } catch (error) {
                    // Skip directories we can't read
                }
            };

            findTsConfigs(this.projectRoot);

            if (tsconfigPaths.length > 0) {
                try {
                    // Try to get TypeScript compiler output
                    const output = execSync('npx tsc --noEmit --pretty false', {
                        cwd: this.projectRoot,
                        encoding: 'utf8',
                        timeout: 30000,
                        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
                    });

                    return {
                        available: true,
                        configCount: tsconfigPaths.length,
                        configs: tsconfigPaths.map(p => path.relative(this.projectRoot, p)),
                        errors: output.split('\n').filter(line => line.trim()).length
                    };
                } catch (error) {
                    return {
                        available: true,
                        configCount: tsconfigPaths.length,
                        configs: tsconfigPaths.map(p => path.relative(this.projectRoot, p)),
                        errors: error.stdout ? error.stdout.split('\n').filter(line => line.trim()).length : 0,
                        compilerError: error.message
                    };
                }
            }

            return {
                available: false,
                reason: 'No tsconfig.json found'
            };
        } catch (error) {
            return {
                available: false,
                reason: error.message
            };
        }
    }

    /**
     * Generate recommendations based on analysis results
     */
    generateRecommendations() {
        const recs = [];

        // Any usage recommendations
        if (this.results.statistics.anyUsageCount > 0) {
            const severity = this.results.statistics.anyUsageCount > 20 ? 'high' :
                this.results.statistics.anyUsageCount > 5 ? 'medium' : 'low';
            recs.push({
                category: 'Type Safety',
                severity,
                issue: `Found ${this.results.statistics.anyUsageCount} uses of 'any' type`,
                recommendation: 'Replace any types with specific type definitions',
                impact: 'Improves type safety and catches more errors at compile time'
            });
        }

        // Type assertion recommendations
        if (this.results.statistics.typeAssertionCount > 0) {
            recs.push({
                category: 'Type Safety',
                severity: 'medium',
                issue: `Found ${this.results.statistics.typeAssertionCount} type assertions`,
                recommendation: 'Consider using type guards or proper typing instead of assertions',
                impact: 'Reduces runtime errors and improves code reliability'
            });
        }

        // Duplicate type recommendations
        if (this.results.statistics.duplicateTypeCount > 0) {
            recs.push({
                category: 'Code Organization',
                severity: 'high',
                issue: `Found ${this.results.statistics.duplicateTypeCount} duplicate type definitions`,
                recommendation: 'Consolidate duplicate types into shared type definition files',
                impact: 'Reduces maintenance burden and prevents type inconsistencies'
            });
        }

        // Missing return types
        if (this.results.statistics.missingReturnTypeCount > 0) {
            recs.push({
                category: 'Code Clarity',
                severity: 'low',
                issue: `Found ${this.results.statistics.missingReturnTypeCount} functions without return types`,
                recommendation: 'Add explicit return type annotations to improve code documentation',
                impact: 'Makes code more self-documenting and catches return type errors'
            });
        }

        // Non-null assertions
        if (this.results.statistics.nonNullAssertionCount > 0) {
            recs.push({
                category: 'Runtime Safety',
                severity: 'medium',
                issue: `Found ${this.results.statistics.nonNullAssertionCount} non-null assertions`,
                recommendation: 'Replace non-null assertions with proper null checking',
                impact: 'Prevents potential runtime null reference errors'
            });
        }

        this.results.recommendations = recs;
    }

    /**
     * Run the complete analysis
     */
    async analyze() {
        console.log('Starting TypeScript analysis...');

        // Find all TypeScript files
        const tsFiles = this.findTypeScriptFiles();
        this.results.summary.totalFiles = tsFiles.length;

        if (tsFiles.length === 0) {
            console.log('No TypeScript files found in project');
            return this.results;
        }

        console.log(`Found ${tsFiles.length} TypeScript files`);

        // Analyze each file
        for (const filePath of tsFiles) {
            this.analyzeFile(filePath);
        }

        // Get compiler diagnostics
        const compilerInfo = this.getCompilerDiagnostics();
        this.results.summary.compilerDiagnostics = compilerInfo;

        // Calculate total issues
        this.results.summary.totalIssues = Object.values(this.results.statistics)
            .reduce((sum, count) => sum + count, 0);

        // Generate recommendations
        this.generateRecommendations();

        console.log(`Analysis complete. Found ${this.results.summary.totalIssues} TypeScript issues.`);

        return this.results;
    }

    /**
     * Generate a human-readable report
     */
    generateReport() {
        const report = [];
        report.push('# TypeScript Analysis Report');
        report.push(`Generated: ${this.results.summary.analyzedAt}`);
        report.push(`Project: ${this.results.summary.projectRoot}`);
        report.push('');

        // Summary
        report.push('## Summary');
        report.push(`- Files analyzed: ${this.results.summary.totalFiles}`);
        report.push(`- Total issues found: ${this.results.summary.totalIssues}`);
        report.push('');

        // Statistics
        report.push('## Issue Breakdown');
        report.push(`- Any type usage: ${this.results.statistics.anyUsageCount}`);
        report.push(`- Type assertions: ${this.results.statistics.typeAssertionCount}`);
        report.push(`- Implicit any: ${this.results.statistics.implicitAnyCount}`);
        report.push(`- Missing return types: ${this.results.statistics.missingReturnTypeCount}`);
        report.push(`- Non-null assertions: ${this.results.statistics.nonNullAssertionCount}`);
        report.push(`- Duplicate types: ${this.results.statistics.duplicateTypeCount}`);
        report.push('');

        // Compiler info
        if (this.results.summary.compilerDiagnostics) {
            const diag = this.results.summary.compilerDiagnostics;
            report.push('## TypeScript Compiler');
            report.push(`- Available: ${diag.available}`);
            if (diag.available) {
                report.push(`- Config files: ${diag.configCount}`);
                if (diag.errors !== undefined) {
                    report.push(`- Compiler errors: ${diag.errors}`);
                }
            }
            report.push('');
        }

        // Recommendations
        if (this.results.recommendations.length > 0) {
            report.push('## Recommendations');
            this.results.recommendations.forEach((rec, index) => {
                report.push(`${index + 1}. **${rec.category}** (${rec.severity})`);
                report.push(`   - Issue: ${rec.issue}`);
                report.push(`   - Recommendation: ${rec.recommendation}`);
                report.push(`   - Impact: ${rec.impact}`);
                report.push('');
            });
        }

        return report.join('\n');
    }
}

/**
 * Main execution
 */
async function main() {
    const projectRoot = process.argv[2] || process.cwd();

    try {
        const analyzer = new TypeScriptAnalyzer(projectRoot);
        const results = await analyzer.analyze();

        // Check if we should output JSON only (for programmatic use)
        const jsonOnly = process.argv.includes('--json');

        if (jsonOnly) {
            // Output only JSON for programmatic use
            console.log(JSON.stringify(results, null, 2));
        } else {
            // Output human-readable report for CLI use
            const report = analyzer.generateReport();
            console.log(report);

            // Also output JSON at the end for parsing
            console.log('\n--- JSON OUTPUT ---');
            console.log(JSON.stringify(results, null, 2));
        }

    } catch (error) {
        console.error('Error during TypeScript analysis:', error.message);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = { TypeScriptAnalyzer };
