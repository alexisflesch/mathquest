#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Bundle Analyzer for MathQuest Quality Monitor
 * 
 * Analyzes webpack bundles, identifies large files, duplicate packages,
 * and provides performance insights for the frontend application.
 */

class BundleAnalyzer {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../../../');
        this.frontendPath = path.join(this.projectRoot, 'frontend');
        this.results = {
            timestamp: new Date().toISOString(),
            bundleSize: {},
            largeBundles: [],
            duplicatePackages: [],
            unusedPackages: [],
            treeshakingIssues: [],
            performanceIssues: [],
            recommendations: [],
            errors: []
        };
    }

    /**
     * Main analysis entry point
     */
    async analyze() {
        console.log('🔍 Starting Bundle Analysis...');
        
        try {
            this.checkFrontendExists();
            await this.analyzeBundleSize();
            await this.findDuplicatePackages();
            await this.checkUnusedDependencies();
            await this.analyzeTreeshaking();
            this.generateRecommendations();
            
            console.log('✅ Bundle analysis completed');
            return this.results;
        } catch (error) {
            console.error('❌ Bundle analysis failed:', error.message);
            this.results.error = error.message;
            return this.results;
        }
    }

    /**
     * Check if frontend directory exists
     */
    checkFrontendExists() {
        if (!fs.existsSync(this.frontendPath)) {
            throw new Error(`Frontend directory not found: ${this.frontendPath}`);
        }
        
        const packageJsonPath = path.join(this.frontendPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error('Frontend package.json not found');
        }
    }

    /**
     * Analyze bundle sizes using Next.js build output
     */
    async analyzeBundleSize() {
        console.log('📦 Analyzing bundle sizes...');
        
        try {
            // Check if .next build directory exists
            const nextBuildPath = path.join(this.frontendPath, '.next');
            if (!fs.existsSync(nextBuildPath)) {
                console.log('⚠️  No .next build found, attempting to build...');
                this.buildNextApp();
            }

            // Analyze static chunks
            const staticPath = path.join(nextBuildPath, 'static', 'chunks');
            if (fs.existsSync(staticPath)) {
                this.analyzeStaticChunks(staticPath);
            }

            // Analyze pages
            const pagesPath = path.join(nextBuildPath, 'static', 'chunks', 'pages');
            if (fs.existsSync(pagesPath)) {
                this.analyzePageChunks(pagesPath);
            }

        } catch (error) {
            console.warn('⚠️  Bundle size analysis failed:', error.message);
            this.results.bundleSize.error = error.message;
            this.results.errors.push({
                category: 'bundle_size',
                error: error.message
            });
        }
    }

    /**
     * Build Next.js app to get bundle info
     */
    buildNextApp() {
        try {
            console.log('🔨 Building Next.js app...');
            execSync('npm run build', { 
                cwd: this.frontendPath, 
                stdio: 'pipe' 
            });
        } catch (error) {
            throw new Error(`Build failed: ${error.message}`);
        }
    }

    /**
     * Analyze static chunk files
     */
    analyzeStaticChunks(staticPath) {
        const chunks = fs.readdirSync(staticPath)
            .filter(file => file.endsWith('.js'))
            .map(file => {
                const filePath = path.join(staticPath, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    sizeKB: Math.round(stats.size / 1024),
                    path: filePath
                };
            })
            .sort((a, b) => b.size - a.size);

        this.results.bundleSize.staticChunks = chunks;
        
        // Flag large chunks (>500KB)
        const largeChunks = chunks.filter(chunk => chunk.sizeKB > 500);
        if (largeChunks.length > 0) {
            this.results.largeBundles.push(...largeChunks.map(chunk => ({
                type: 'static_chunk',
                file: chunk.name,
                size: chunk.sizeKB,
                severity: chunk.sizeKB > 1000 ? 'high' : 'medium'
            })));
        }
    }

    /**
     * Analyze page-specific chunks
     */
    analyzePageChunks(pagesPath) {
        const pageChunks = fs.readdirSync(pagesPath)
            .filter(file => file.endsWith('.js'))
            .map(file => {
                const filePath = path.join(pagesPath, file);
                const stats = fs.statSync(filePath);
                return {
                    page: file.replace('.js', ''),
                    size: stats.size,
                    sizeKB: Math.round(stats.size / 1024)
                };
            })
            .sort((a, b) => b.size - a.size);

        this.results.bundleSize.pageChunks = pageChunks;

        // Flag large page chunks (>200KB)
        const largePages = pageChunks.filter(chunk => chunk.sizeKB > 200);
        if (largePages.length > 0) {
            this.results.largeBundles.push(...largePages.map(chunk => ({
                type: 'page_chunk',
                page: chunk.page,
                size: chunk.sizeKB,
                severity: chunk.sizeKB > 500 ? 'high' : 'medium'
            })));
        }
    }

    /**
     * Find duplicate packages in bundle
     */
    async findDuplicatePackages() {
        console.log('🔍 Checking for duplicate packages...');
        
        // Try package-lock.json analysis first (more reliable)
        const lockfilePath = path.join(this.frontendPath, 'package-lock.json');
        if (fs.existsSync(lockfilePath)) {
            this.analyzePackageLock(lockfilePath);
        }

        // Try depcheck as fallback (if available)
        try {
            const output = execSync('npx depcheck --json', { 
                cwd: this.frontendPath,
                encoding: 'utf8',
                timeout: 30000
            });
            
            const depcheckResult = JSON.parse(output);
            
            // Store unused dependencies from depcheck
            if (depcheckResult.dependencies && depcheckResult.dependencies.length > 0) {
                this.results.unusedPackages.push(...depcheckResult.dependencies.map(dep => ({
                    package: dep,
                    type: 'unused_dependency',
                    source: 'depcheck',
                    impact: 'bundle_size'
                })));
            }

        } catch (error) {
            console.warn('⚠️  Depcheck failed, using package-lock analysis only');
            this.results.errors.push({
                category: 'depcheck',
                error: 'Depcheck command failed',
                suggestion: 'Run npm ls to manually check for duplicates'
            });
        }
    }

    /**
     * Analyze package-lock.json for duplicate versions
     */
    analyzePackageLock(lockfilePath) {
        try {
            const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
            const packageVersions = {};

            // Recursively collect all package versions
            const collectPackages = (dependencies, depth = 0) => {
                if (!dependencies || depth > 10) return; // Prevent infinite recursion
                
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

            // Find packages with multiple versions
            const duplicates = Object.entries(packageVersions)
                .filter(([name, versions]) => versions.size > 1)
                .map(([name, versions]) => ({
                    package: name,
                    versions: Array.from(versions),
                    count: versions.size,
                    impact: 'bundle_bloat',
                    source: 'package-lock'
                }));

            if (duplicates.length > 0) {
                this.results.duplicatePackages.push(...duplicates);
                console.log(`📦 Found ${duplicates.length} packages with multiple versions`);
            } else {
                console.log('✅ No duplicate package versions found');
            }

        } catch (error) {
            console.warn('⚠️  Package lock analysis failed:', error.message);
            this.results.errors.push({
                category: 'package_lock',
                error: error.message
            });
        }
    }

    /**
     * Check for unused dependencies (fallback method)
     */
    async checkUnusedDependencies() {
        console.log('🧹 Checking for unused dependencies...');
        
        // If depcheck already ran, skip this
        if (this.results.unusedPackages.length > 0) {
            return;
        }

        try {
            const output = execSync('npx depcheck --json', { 
                cwd: this.frontendPath,
                encoding: 'utf8',
                timeout: 30000
            });
            
            const result = JSON.parse(output);
            
            if (result.dependencies && result.dependencies.length > 0) {
                this.results.unusedPackages.push(...result.dependencies.map(dep => ({
                    name: dep,
                    type: 'dependency',
                    recommendation: 'Consider removing if truly unused'
                })));
            }

            if (result.devDependencies && result.devDependencies.length > 0) {
                this.results.unusedPackages.push(...result.devDependencies.map(dep => ({
                    name: dep,
                    type: 'devDependency',
                    recommendation: 'Consider removing if truly unused'
                })));
            }

        } catch (error) {
            console.warn('⚠️  Unused dependency check failed');
            this.results.errors.push({
                category: 'unused_deps',
                error: 'Depcheck command failed'
            });
        }
    }

    /**
     * Analyze tree-shaking effectiveness
     */
    async analyzeTreeshaking() {
        console.log('🌳 Analyzing tree-shaking effectiveness...');
        
        try {
            // Look for common tree-shaking issues
            const srcPath = path.join(this.frontendPath, 'src');
            if (!fs.existsSync(srcPath)) return;

            this.checkForBarrelExports(srcPath);
            this.checkForLargeImports(srcPath);

        } catch (error) {
            console.warn('⚠️  Tree-shaking analysis failed:', error.message);
            this.results.errors.push({
                category: 'treeshaking',
                error: error.message
            });
        }
    }

    /**
     * Check for barrel exports that might hurt tree-shaking
     */
    checkForBarrelExports(srcPath) {
        const findIndexFiles = (dir) => {
            const files = [];
            try {
                const items = fs.readdirSync(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory() && item !== 'node_modules') {
                        files.push(...findIndexFiles(fullPath));
                    } else if (item === 'index.ts' || item === 'index.js') {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
            return files;
        };

        const indexFiles = findIndexFiles(srcPath);
        
        for (const indexFile of indexFiles) {
            try {
                const content = fs.readFileSync(indexFile, 'utf8');
                const exportLines = content.split('\n').filter(line => 
                    line.trim().startsWith('export') && line.includes('from')
                );
                
                if (exportLines.length > 5) {
                    this.results.treeshakingIssues.push({
                        file: indexFile.replace(this.projectRoot, ''),
                        issue: 'large_barrel_export',
                        exportCount: exportLines.length,
                        recommendation: 'Consider splitting or using direct imports'
                    });
                }
            } catch (error) {
                // Skip files we can't read
            }
        }
    }

    /**
     * Check for imports of large libraries
     */
    checkForLargeImports(srcPath) {
        const largeLibraries = [
            'lodash',
            'moment',
            'date-fns',
            'rxjs',
            'antd',
            'material-ui',
            '@mui/material'
        ];

        const findTsFiles = (dir) => {
            const files = [];
            try {
                const items = fs.readdirSync(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory() && item !== 'node_modules') {
                        files.push(...findTsFiles(fullPath));
                    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
            return files;
        };

        const tsFiles = findTsFiles(srcPath);
        
        for (const file of tsFiles) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                for (const lib of largeLibraries) {
                    // Check for full library imports
                    const fullImportRegex = new RegExp(`import\\s+.*\\s+from\\s+['"]${lib}['"]`, 'g');
                    if (fullImportRegex.test(content)) {
                        this.results.treeshakingIssues.push({
                            file: file.replace(this.projectRoot, ''),
                            library: lib,
                            issue: 'full_library_import',
                            recommendation: `Use specific imports like 'import { specific } from '${lib}/specific''`
                        });
                    }
                }
            } catch (error) {
                // Skip files we can't read
            }
        }
    }

    /**
     * Generate performance recommendations
     */
    generateRecommendations() {
        console.log('💡 Generating recommendations...');
        
        const recommendations = [];

        // Bundle size recommendations
        if (this.results.largeBundles.length > 0) {
            recommendations.push({
                category: 'bundle_size',
                priority: 'high',
                issue: `Found ${this.results.largeBundles.length} large bundles`,
                action: 'Consider code splitting, lazy loading, or removing unused code',
                files: this.results.largeBundles.map(b => b.file || b.page)
            });
        }

        // Duplicate package recommendations (only for actual duplicates, not errors)
        const actualDuplicates = this.results.duplicatePackages.filter(p => p.package && p.versions);
        if (actualDuplicates.length > 0) {
            recommendations.push({
                category: 'duplicates',
                priority: 'medium',
                issue: `Found ${actualDuplicates.length} duplicate packages`,
                action: 'Run npm dedupe or update package versions to resolve conflicts',
                packages: actualDuplicates.map(p => p.package)
            });
        }

        // Unused dependencies recommendations
        if (this.results.unusedPackages.length > 0) {
            recommendations.push({
                category: 'cleanup',
                priority: 'low',
                issue: `Found ${this.results.unusedPackages.length} unused packages`,
                action: 'Remove unused dependencies to reduce bundle size',
                packages: this.results.unusedPackages.map(p => p.name || p.package)
            });
        }

        // Tree-shaking recommendations
        if (this.results.treeshakingIssues.length > 0) {
            recommendations.push({
                category: 'treeshaking',
                priority: 'medium',
                issue: `Found ${this.results.treeshakingIssues.length} tree-shaking issues`,
                action: 'Use specific imports and avoid barrel exports',
                files: this.results.treeshakingIssues.map(i => i.file)
            });
        }

        this.results.recommendations = recommendations;
    }

    /**
     * Generate summary report
     */
    generateSummary() {
        const totalBundleSize = this.results.bundleSize.staticChunks 
            ? this.results.bundleSize.staticChunks.reduce((sum, chunk) => sum + chunk.sizeKB, 0)
            : 0;

        // Count only actual duplicates, not errors
        const actualDuplicatesCount = this.results.duplicatePackages.filter(p => p.package && p.versions).length;

        return {
            totalBundleSizeKB: totalBundleSize,
            largeFilesCount: this.results.largeBundles.length,
            duplicatePackagesCount: actualDuplicatesCount,
            unusedPackagesCount: this.results.unusedPackages.length,
            treeshakingIssuesCount: this.results.treeshakingIssues.length,
            recommendationsCount: this.results.recommendations.length,
            errorsCount: this.results.errors.length,
            overallScore: this.calculateOverallScore()
        };
    }

    /**
     * Calculate overall bundle health score (0-100)
     */
    calculateOverallScore() {
        let score = 100;
        
        // Count only actual duplicates for scoring
        const actualDuplicatesCount = this.results.duplicatePackages.filter(p => p.package && p.versions).length;
        
        // Deduct points for issues
        score -= this.results.largeBundles.length * 10;
        score -= actualDuplicatesCount * 5;
        score -= this.results.unusedPackages.length * 2;
        score -= this.results.treeshakingIssues.length * 3;
        score -= this.results.errors.length * 1; // Small penalty for errors
        
        return Math.max(0, score);
    }
}

// CLI execution
if (require.main === module) {
    const analyzer = new BundleAnalyzer();
    
    analyzer.analyze().then(results => {
        const summary = analyzer.generateSummary();
        
        console.log('\n📊 Bundle Analysis Summary:');
        console.log(`Total Bundle Size: ${summary.totalBundleSizeKB} KB`);
        console.log(`Large Files: ${summary.largeFilesCount}`);
        console.log(`Duplicate Packages: ${summary.duplicatePackagesCount}`);
        console.log(`Unused Packages: ${summary.unusedPackagesCount}`);
        console.log(`Tree-shaking Issues: ${summary.treeshakingIssuesCount}`);
        console.log(`Errors: ${summary.errorsCount}`);
        console.log(`Overall Score: ${summary.overallScore}/100`);
        
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
        console.error('Failed to analyze bundle:', error);
        process.exit(1);
    });
}

module.exports = BundleAnalyzer;
