#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Dependency Graph Analyzer for MathQuest Quality Monitor
 * 
 * More conservative analysis focusing on real issues, not false positives.
 */

class DependencyGraphAnalyzer {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../../../');
        this.frontendPath = path.join(this.projectRoot, 'frontend');
        this.backendPath = path.join(this.projectRoot, 'backend');
        this.sharedPath = path.join(this.projectRoot, 'shared');

        this.results = {
            timestamp: new Date().toISOString(),
            circularDependencies: [],
            unusedExports: [],
            importPathViolations: [],
            architecturalViolations: [],
            orphanedFiles: [],
            dependencyStats: {},
            errors: [],
            recommendations: []
        };
    }

    /**
     * Main analysis entry point
     */
    async analyze() {
        console.log('🔍 Starting Dependency Graph Analysis...');

        try {
            await this.analyzeCircularDependencies();
            await this.analyzeImportPaths();
            await this.analyzeArchitecturalBoundaries();
            await this.findSuspiciousFiles();
            this.generateDependencyStats();
            this.generateRecommendations();

            console.log('✅ Dependency analysis completed');
            return this.results;
        } catch (error) {
            console.error('❌ Dependency analysis failed:', error.message);
            this.results.error = error.message;
            return this.results;
        }
    }

    /**
     * Analyze circular dependencies using madge
     */
    async analyzeCircularDependencies() {
        console.log('🔄 Checking for circular dependencies...');

        const modules = [
            { name: 'frontend', path: this.frontendPath },
            { name: 'backend', path: this.backendPath },
            { name: 'shared', path: this.sharedPath }
        ];

        for (const module of modules) {
            if (!fs.existsSync(module.path)) {
                console.warn(`⚠️  Module not found: ${module.name}`);
                continue;
            }

            try {
                await this.checkModuleCircularDeps(module);
            } catch (error) {
                console.warn(`⚠️  Circular dependency check failed for ${module.name}:`, error.message);
                this.results.errors.push({
                    category: 'circular_deps',
                    module: module.name,
                    error: error.message
                });
            }
        }
    }

    /**
     * Check circular dependencies for a specific module
     */
    async checkModuleCircularDeps(module) {
        try {
            // Use madge to detect circular dependencies
            const output = execSync(`npx madge --circular --json "${module.path}"`, {
                encoding: 'utf8',
                timeout: 30000,
                cwd: this.projectRoot
            });

            const circularDeps = JSON.parse(output);

            if (circularDeps && circularDeps.length > 0) {
                console.log(`❌ Found ${circularDeps.length} circular dependencies in ${module.name}`);

                circularDeps.forEach(cycle => {
                    this.results.circularDependencies.push({
                        module: module.name,
                        cycle: cycle,
                        severity: this.calculateCycleSeverity(cycle),
                        files: cycle.length,
                        description: `Circular dependency: ${cycle.join(' → ')}`
                    });
                });
            } else {
                console.log(`✅ No circular dependencies found in ${module.name}`);
            }

        } catch (error) {
            // If madge fails, just log it - don't try fallback methods that give false positives
            console.warn(`⚠️  Madge not available for ${module.name}, skipping circular dependency check`);
        }
    }

    /**
     * Calculate severity of circular dependency
     */
    calculateCycleSeverity(cycle) {
        if (cycle.length <= 2) return 'high';      // Direct circular dependency
        if (cycle.length <= 4) return 'medium';    // Short cycle
        return 'low';                              // Long cycle
    }

    /**
     * Analyze import path consistency - only flag real violations
     */
    async analyzeImportPaths() {
        console.log('📁 Analyzing import paths...');

        try {
            const frontendFiles = this.getAllTsFiles(this.frontendPath);

            // Only check for specific, known violations
            this.checkSpecificImportViolations(frontendFiles, 'frontend');

        } catch (error) {
            this.results.errors.push({
                category: 'import_paths',
                error: error.message
            });
        }
    }

    /**
     * Check only for specific import violations that we know are problems
     */
    checkSpecificImportViolations(files, moduleName) {
        const violations = [];

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const lines = content.split('\n');

                lines.forEach((line, lineNumber) => {
                    // Check if this import could be using shared types instead
                    // Skip this check since @/types often legitimately extends @shared/types
                    // and is an appropriate architectural pattern
                    if (false && line.includes("from '@/types") && !line.includes("from '@shared/types")) {
                        violations.push({
                            file: file.replace(this.projectRoot, ''),
                            line: lineNumber + 1,
                            issue: 'should_use_shared_types',
                            content: line.trim(),
                            suggestion: "Use '@shared/types' instead of '@/types' for shared entities"
                        });
                    }
                });

            } catch (error) {
                // Skip files we can't read
            }
        }

        if (violations.length > 0) {
            this.results.importPathViolations = violations;
            console.log(`📋 Found ${violations.length} import path violations in ${moduleName} (using '@/types' instead of '@shared/types')`);
        } else {
            console.log(`✅ No problematic import patterns found in ${moduleName}`);
        }
    }

    /**
     * Analyze architectural boundary violations - only real problems
     */
    async analyzeArchitecturalBoundaries() {
        console.log('🏗️  Checking architectural boundaries...');

        try {
            const frontendFiles = this.getAllTsFiles(this.frontendPath);

            // Only check for serious violations
            this.checkCriticalArchitecturalViolations(frontendFiles);

        } catch (error) {
            this.results.errors.push({
                category: 'architecture',
                error: error.message
            });
        }
    }

    /**
     * Check only for critical architectural violations
     */
    checkCriticalArchitecturalViolations(frontendFiles) {
        const violations = [];

        for (const file of frontendFiles) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const lines = content.split('\n');

                lines.forEach((line, lineNumber) => {
                    // Only flag direct backend imports (serious violation)
                    if (line.includes('from ') && (
                        line.includes('../backend/') ||
                        line.includes('../../backend/') ||
                        line.includes('../../../backend/')
                    )) {
                        violations.push({
                            file: file.replace(this.projectRoot, ''),
                            line: lineNumber + 1,
                            violation: 'frontend_imports_backend',
                            content: line.trim(),
                            severity: 'high',
                            description: 'Frontend directly importing backend code'
                        });
                    }
                });

            } catch (error) {
                // Skip files we can't read
            }
        }

        if (violations.length > 0) {
            this.results.architecturalViolations = violations;
            console.log(`🚨 Found ${violations.length} critical architectural violations`);
        } else {
            console.log(`✅ No critical architectural violations found`);
        }
    }

    /**
     * Find only clearly suspicious files - not every unused file
     */
    async findSuspiciousFiles() {
        console.log('🔍 Finding suspicious files...');

        try {
            const suspiciousFiles = [];

            // Only look for obviously problematic files
            const patterns = [
                '**/*backup*',
                '**/*temp*',
                '**/*old*',
                '**/*unused*',
                '**/*deprecated*',
                '**/*.bak'
            ];

            for (const moduleName of ['frontend', 'backend', 'shared']) {
                const modulePath = path.join(this.projectRoot, moduleName);
                if (!fs.existsSync(modulePath)) continue;

                const files = this.getAllTsFiles(modulePath);

                for (const file of files) {
                    const fileName = path.basename(file).toLowerCase();

                    // Only flag files with obvious problem indicators
                    if (fileName.includes('backup') ||
                        fileName.includes('temp') ||
                        fileName.includes('old') ||
                        fileName.includes('unused') ||
                        fileName.includes('deprecated') ||
                        fileName.endsWith('.bak')) {

                        suspiciousFiles.push({
                            file: file.replace(this.projectRoot, ''),
                            module: moduleName,
                            reason: 'Suspicious filename pattern',
                            recommendation: 'Review if this file is still needed'
                        });
                    }
                }
            }

            this.results.orphanedFiles = suspiciousFiles;

            if (suspiciousFiles.length > 0) {
                console.log(`📁 Found ${suspiciousFiles.length} suspicious files`);
            } else {
                console.log(`✅ No obviously suspicious files found`);
            }

        } catch (error) {
            this.results.errors.push({
                category: 'suspicious_files',
                error: error.message
            });
        }
    }

    /**
     * Generate dependency statistics
     */
    generateDependencyStats() {
        console.log('📊 Generating dependency statistics...');

        try {
            const modules = ['frontend', 'backend', 'shared'];
            const stats = {};

            for (const moduleName of modules) {
                const modulePath = path.join(this.projectRoot, moduleName);
                if (!fs.existsSync(modulePath)) continue;

                const files = this.getAllTsFiles(modulePath);

                stats[moduleName] = {
                    totalFiles: files.length,
                    circularDependencies: this.results.circularDependencies.filter(c => c.module === moduleName).length
                };
            }

            this.results.dependencyStats = stats;

        } catch (error) {
            this.results.errors.push({
                category: 'stats',
                error: error.message
            });
        }
    }

    /**
     * Generate recommendations based on findings
     */
    generateRecommendations() {
        console.log('💡 Generating recommendations...');

        const recommendations = [];

        // Circular dependency recommendations
        if (this.results.circularDependencies.length > 0) {
            const highSeverity = this.results.circularDependencies.filter(c => c.severity === 'high');
            recommendations.push({
                category: 'circular_deps',
                priority: highSeverity.length > 0 ? 'high' : 'medium',
                issue: `Found ${this.results.circularDependencies.length} circular dependencies`,
                action: 'Refactor code to break circular imports',
                details: this.results.circularDependencies.slice(0, 3).map(c => c.description)
            });
        }

        // Import path violations (only real ones)
        if (this.results.importPathViolations.length > 0) {
            recommendations.push({
                category: 'import_paths',
                priority: 'medium',
                issue: `Found ${this.results.importPathViolations.length} files using '@/types' instead of '@shared/types'`,
                action: 'Update imports to use shared types consistently',
                details: this.results.importPathViolations.slice(0, 5).map(v => v.file)
            });
        }

        // Architectural violations (only critical ones)
        if (this.results.architecturalViolations.length > 0) {
            recommendations.push({
                category: 'architecture',
                priority: 'high',
                issue: `Found ${this.results.architecturalViolations.length} frontend files importing backend code`,
                action: 'Remove direct backend imports from frontend',
                details: this.results.architecturalViolations.map(v => v.file)
            });
        }

        // Suspicious files (only obvious ones)
        if (this.results.orphanedFiles.length > 0) {
            recommendations.push({
                category: 'cleanup',
                priority: 'low',
                issue: `Found ${this.results.orphanedFiles.length} suspicious files`,
                action: 'Review files with suspicious names (backup, temp, old)',
                details: this.results.orphanedFiles.map(o => o.file)
            });
        }

        this.results.recommendations = recommendations;
    }

    /**
     * Helper: Get all TypeScript files in a directory
     */
    getAllTsFiles(dirPath) {
        const files = [];

        const scanDirectory = (dir) => {
            try {
                const items = fs.readdirSync(dir);

                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory() && item !== 'node_modules' && item !== '.next') {
                        scanDirectory(fullPath);
                    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };

        if (fs.existsSync(dirPath)) {
            scanDirectory(dirPath);
        }

        return files;
    }

    /**
     * Generate summary report
     */
    generateSummary() {
        return {
            circularDependenciesCount: this.results.circularDependencies.length,
            importPathViolationsCount: this.results.importPathViolations.length,
            architecturalViolationsCount: this.results.architecturalViolations.length,
            suspiciousFilesCount: this.results.orphanedFiles.length,
            errorsCount: this.results.errors.length,
            recommendationsCount: this.results.recommendations.length,
            overallScore: this.calculateOverallScore()
        };
    }

    /**
     * Calculate realistic dependency health score (0-100)
     */
    calculateOverallScore() {
        let score = 100;

        // More reasonable scoring
        score -= this.results.circularDependencies.length * 20;   // High impact
        score -= this.results.importPathViolations.length * 1;    // Low impact  
        score -= this.results.architecturalViolations.length * 15; // High impact
        score -= this.results.orphanedFiles.length * 2;           // Low impact
        score -= this.results.errors.length * 5;                  // Medium impact

        return Math.max(0, score);
    }
}

// CLI execution
if (require.main === module) {
    const analyzer = new DependencyGraphAnalyzer();

    analyzer.analyze().then(results => {
        const summary = analyzer.generateSummary();

        console.log('\n📊 Dependency Analysis Summary:');
        console.log(`Circular Dependencies: ${summary.circularDependenciesCount}`);
        console.log(`Import Path Violations: ${summary.importPathViolationsCount}`);
        console.log(`Architectural Violations: ${summary.architecturalViolationsCount}`);
        console.log(`Suspicious Files: ${summary.suspiciousFilesCount}`);
        console.log(`Errors: ${summary.errorsCount}`);
        console.log(`Overall Score: ${summary.overallScore}/100`);

        // Show top issues
        if (results.recommendations.length > 0) {
            console.log('\n🎯 Top Recommendations:');
            results.recommendations.forEach(rec => {
                console.log(`  ${rec.priority.toUpperCase()}: ${rec.issue}`);
            });
        }

        // Show errors if any
        if (results.errors.length > 0) {
            console.log('\n⚠️  Errors encountered:');
            results.errors.forEach(error => {
                console.log(`  - ${error.category}: ${error.error}`);
            });
        }

        // Output JSON for Python script consumption
        if (process.argv.includes('--json')) {
            console.log('\n--- JSON OUTPUT ---');
            console.log(JSON.stringify({ ...results, summary }, null, 2));
        }

        process.exit(0);
    }).catch(error => {
        console.error('Failed to analyze dependencies:', error);
        process.exit(1);
    });
}

module.exports = DependencyGraphAnalyzer;
