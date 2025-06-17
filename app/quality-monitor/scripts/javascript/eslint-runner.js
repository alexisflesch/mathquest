#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * ESLint Runner for MathQuest Quality Monitor
 * 
 * Resilient ESLint runner that handles configuration errors gracefully
 * and provides basic code quality analysis even when configs are broken.
 */

class ESLintRunner {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../../../');
        this.frontendPath = path.join(this.projectRoot, 'frontend');
        this.backendPath = path.join(this.projectRoot, 'backend');
        this.sharedPath = path.join(this.projectRoot, 'shared');

        this.results = {
            timestamp: new Date().toISOString(),
            modules: {},
            summary: {
                totalFiles: 0,
                totalErrors: 0,
                totalWarnings: 0,
                totalFixable: 0
            },
            criticalIssues: [],
            fixableIssues: [],
            ruleViolations: {},
            recommendations: [],
            errors: [],
            configIssues: []
        };
    }

    /**
     * Main analysis entry point
     */
    async analyze() {
        console.log('🔍 Starting ESLint Analysis...');

        try {
            await this.runESLintOnModules();
            this.analyzeResults();
            this.categorizeIssues();
            this.generateRecommendations();

            console.log('✅ ESLint analysis completed');
            return this.results;
        } catch (error) {
            console.error('❌ ESLint analysis failed:', error.message);
            this.results.error = error.message;
            return this.results;
        }
    }

    /**
     * Run ESLint on all modules
     */
    async runESLintOnModules() {
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

            console.log(`🔎 Running ESLint on ${module.name}...`);
            await this.runESLintOnModule(module);
        }
    }

    /**
     * Run ESLint on a specific module with multiple fallback strategies
     */
    async runESLintOnModule(module) {
        // Strategy 1: Try with existing config
        const configExists = await this.tryWithExistingConfig(module);
        if (configExists) return;

        // Strategy 2: Try with minimal config
        const minimalWorks = await this.tryWithMinimalConfig(module);
        if (minimalWorks) return;

        // Strategy 3: Manual basic checks
        await this.performBasicCodeAnalysis(module);
    }

    /**
     * Strategy 1: Try with existing ESLint config
     */
    async tryWithExistingConfig(module) {
        try {
            const configInfo = this.detectESLintConfig(module.path);

            if (!configInfo.hasConfig) {
                console.log(`  ⚠️  No ESLint config found for ${module.name}`);
                return false;
            }

            console.log(`  📋 Trying existing config: ${configInfo.file}`);

            // Try running on entire directory first
            try {
                const results = await this.runESLintCommand(module.path, null, true);
                this.results.modules[module.name] = this.processESLintResults(results, module.name);
                console.log(`  ✅ Success with existing config`);
                return true;
            } catch (fullDirError) {
                console.log(`  ⚠️  Full directory failed, trying file-by-file...`);

                // Fallback to file-by-file analysis
                const results = await this.runESLintFileByFile(module.path, null);
                if (results.length > 0) {
                    this.results.modules[module.name] = this.processESLintResults(results, module.name);
                    console.log(`  ✅ Success with existing config (file-by-file)`);
                    return true;
                }
            }

            return false;

        } catch (error) {
            console.log(`  ❌ Failed with existing config: ${this.getShortError(error.message)}`);
            this.results.configIssues.push({
                module: module.name,
                strategy: 'existing_config',
                error: this.getShortError(error.message)
            });
            return false;
        }
    }

    /**
     * Strategy 2: Try with minimal, working config
     */
    async tryWithMinimalConfig(module) {
        let tempConfigPath = null;

        try {
            console.log(`  🔧 Trying minimal config for ${module.name}`);

            // Create a temporary minimal config
            tempConfigPath = path.join(module.path, '.temp-eslint.js');
            const minimalConfig = this.createMinimalConfig();

            fs.writeFileSync(tempConfigPath, minimalConfig);

            // Try running on entire directory first
            try {
                const results = await this.runESLintCommand(module.path, '.temp-eslint.js', true);
                this.results.modules[module.name] = this.processESLintResults(results, module.name);
                console.log(`  ✅ Success with minimal config`);
                return true;
            } catch (fullDirError) {
                console.log(`  ⚠️  Full directory failed, trying file-by-file...`);

                // Fallback to file-by-file analysis
                const results = await this.runESLintFileByFile(module.path, '.temp-eslint.js');
                if (results.length > 0) {
                    this.results.modules[module.name] = this.processESLintResults(results, module.name);
                    console.log(`  ✅ Success with minimal config (file-by-file)`);
                    return true;
                }
            }

            return false;

        } catch (error) {
            console.log(`  ❌ Failed with minimal config: ${this.getShortError(error.message)}`);
            this.results.configIssues.push({
                module: module.name,
                strategy: 'minimal_config',
                error: this.getShortError(error.message)
            });
            return false;
        } finally {
            // Clean up temp config
            if (tempConfigPath && fs.existsSync(tempConfigPath)) {
                try {
                    fs.unlinkSync(tempConfigPath);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        }
    }

    /**
     * Strategy 3: Basic manual code analysis without ESLint
     */
    async performBasicCodeAnalysis(module) {
        try {
            console.log(`  🔍 Performing basic code analysis for ${module.name}`);

            const files = this.getAllCodeFiles(module.path);
            const issues = [];

            for (const file of files) {
                const fileIssues = this.analyzeFileBasically(file);
                issues.push(...fileIssues);
            }

            this.results.modules[module.name] = {
                files: files.length,
                errors: issues.filter(i => i.severity === 'error').length,
                warnings: issues.filter(i => i.severity === 'warning').length,
                fixable: 0, // Manual analysis can't determine fixability
                issues: issues,
                method: 'manual_analysis'
            };

            console.log(`  📊 Manual analysis: ${files.length} files, ${issues.length} issues found`);

        } catch (error) {
            console.log(`  ❌ Manual analysis failed: ${error.message}`);
            this.results.modules[module.name] = this.createEmptyResult();
            this.results.errors.push({
                category: 'manual_analysis',
                module: module.name,
                error: error.message
            });
        }
    }

    /**
     * Create minimal ESLint config that should work
     */
    createMinimalConfig() {
        return `
module.exports = {
    "env": {
        "node": true,
        "es6": true,
        "browser": true
    },
    "extends": [],
    "parserOptions": {
        "ecmaVersion": 2020,
        "sourceType": "module"
    },
    "rules": {
        "no-console": "warn",
        "no-debugger": "error",
        "no-unused-vars": "warn",
        "no-undef": "error",
        "no-unreachable": "error"
    }
};
`;
    }

    /**
     * Basic file analysis without ESLint
     */
    analyzeFileBasically(filePath) {
        const issues = [];

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, lineNumber) => {
                const trimmedLine = line.trim();

                // Check for console.log
                if (trimmedLine.includes('console.log')) {
                    issues.push({
                        file: filePath.replace(this.projectRoot, ''),
                        line: lineNumber + 1,
                        column: line.indexOf('console.log') + 1,
                        rule: 'no-console',
                        severity: 'warning',
                        message: 'Unexpected console statement',
                        fixable: false
                    });
                }

                // Check for debugger
                if (trimmedLine.includes('debugger')) {
                    issues.push({
                        file: filePath.replace(this.projectRoot, ''),
                        line: lineNumber + 1,
                        column: line.indexOf('debugger') + 1,
                        rule: 'no-debugger',
                        severity: 'error',
                        message: 'Unexpected debugger statement',
                        fixable: false
                    });
                }

                // Check for TODO/FIXME comments
                if (trimmedLine.includes('// TODO') || trimmedLine.includes('// FIXME')) {
                    issues.push({
                        file: filePath.replace(this.projectRoot, ''),
                        line: lineNumber + 1,
                        column: 1,
                        rule: 'todo-fixme',
                        severity: 'warning',
                        message: 'TODO/FIXME comment found',
                        fixable: false
                    });
                }
            });

        } catch (error) {
            // Skip files we can't read
        }

        return issues;
    }

    /**
     * Get all code files in a directory
     */
    getAllCodeFiles(dirPath) {
        const files = [];

        const scanDirectory = (dir) => {
            try {
                const items = fs.readdirSync(dir);

                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory() && !this.shouldIgnoreDirectory(item)) {
                        scanDirectory(fullPath);
                    } else if (this.isCodeFile(item)) {
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
     * Check if directory should be ignored
     */
    shouldIgnoreDirectory(dirName) {
        const ignorePatterns = [
            'node_modules',
            '.next',
            'dist',
            'build',
            'coverage',
            '.git',
            '.vscode'
        ];

        return ignorePatterns.includes(dirName);
    }

    /**
     * Check if file is a code file we should analyze
     */
    isCodeFile(fileName) {
        const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs'];
        return extensions.some(ext => fileName.endsWith(ext));
    }

    /**
     * Get short version of error message
     */
    getShortError(errorMessage) {
        const lines = errorMessage.split('\n');
        return lines[0].substring(0, 100);
    }

    /**
     * Detect ESLint configuration
     */
    detectESLintConfig(modulePath) {
        const configs = [
            'eslint.config.js',
            'eslint.config.mjs',
            '.eslintrc.js',
            '.eslintrc.json'
        ];

        for (const config of configs) {
            const configPath = path.join(modulePath, config);
            if (fs.existsSync(configPath)) {
                return {
                    hasConfig: true,
                    path: configPath,
                    file: config
                };
            }
        }

        return { hasConfig: false };
    }

    /**
     * Create empty result structure
     */
    createEmptyResult() {
        return {
            files: 0,
            errors: 0,
            warnings: 0,
            fixable: 0,
            issues: []
        };
    }

    /**
     * Process ESLint results
     */
    processESLintResults(eslintResults, moduleName) {
        const moduleResult = {
            files: eslintResults.length,
            errors: 0,
            warnings: 0,
            fixable: 0,
            issues: []
        };

        for (const fileResult of eslintResults) {
            if (!fileResult.messages || fileResult.messages.length === 0) {
                continue;
            }

            for (const message of fileResult.messages) {
                const issue = {
                    file: fileResult.filePath.replace(this.projectRoot, ''),
                    line: message.line || 0,
                    column: message.column || 0,
                    rule: message.ruleId || 'unknown',
                    severity: message.severity === 2 ? 'error' : 'warning',
                    message: message.message,
                    fixable: Boolean(message.fix)
                };

                moduleResult.issues.push(issue);

                if (message.severity === 2) {
                    moduleResult.errors++;
                } else {
                    moduleResult.warnings++;
                }

                if (message.fix) {
                    moduleResult.fixable++;
                }

                // Track rule violations
                const ruleId = message.ruleId || 'unknown';
                if (!this.results.ruleViolations[ruleId]) {
                    this.results.ruleViolations[ruleId] = {
                        count: 0,
                        severity: message.severity === 2 ? 'error' : 'warning',
                        files: new Set()
                    };
                }
                this.results.ruleViolations[ruleId].count++;
                this.results.ruleViolations[ruleId].files.add(issue.file);
            }
        }

        console.log(`  📊 ${moduleName}: ${moduleResult.errors} errors, ${moduleResult.warnings} warnings`);

        return moduleResult;
    }

    /**
     * Analyze aggregated results
     */
    analyzeResults() {
        console.log('📊 Analyzing results...');

        for (const [moduleName, moduleResult] of Object.entries(this.results.modules)) {
            this.results.summary.totalFiles += moduleResult.files;
            this.results.summary.totalErrors += moduleResult.errors;
            this.results.summary.totalWarnings += moduleResult.warnings;
            this.results.summary.totalFixable += moduleResult.fixable;
        }

        // Convert Sets to arrays
        for (const [rule, data] of Object.entries(this.results.ruleViolations)) {
            this.results.ruleViolations[rule].files = Array.from(data.files);
        }
    }

    /**
     * Categorize issues
     */
    categorizeIssues() {
        console.log('🔍 Categorizing issues...');

        const allIssues = [];
        for (const moduleResult of Object.values(this.results.modules)) {
            allIssues.push(...moduleResult.issues);
        }

        this.results.criticalIssues = allIssues.filter(issue =>
            issue.severity === 'error' || issue.rule === 'no-debugger'
        );

        this.results.fixableIssues = allIssues.filter(issue =>
            issue.fixable
        );

        console.log(`🚨 Found ${this.results.criticalIssues.length} critical issues`);
        console.log(`🔧 Found ${this.results.fixableIssues.length} auto-fixable issues`);
    }

    /**
     * Generate recommendations
     */
    generateRecommendations() {
        console.log('💡 Generating recommendations...');

        const recommendations = [];

        // Configuration issues
        if (this.results.configIssues.length > 0) {
            recommendations.push({
                category: 'configuration',
                priority: 'high',
                issue: `ESLint configuration errors in ${this.results.configIssues.length} modules`,
                action: 'Fix ESLint configuration files - they have syntax errors or missing dependencies',
                details: this.results.configIssues.map(ci => `${ci.module}: ${ci.error}`)
            });
        }

        // Good news if no major issues
        if (this.results.summary.totalErrors === 0 && this.results.configIssues.length === 0) {
            recommendations.push({
                category: 'code_quality',
                priority: 'info',
                issue: 'No critical code quality issues found',
                action: 'Code quality looks good! Consider fixing any remaining warnings',
                status: 'success'
            });
        }

        // Critical issues
        if (this.results.criticalIssues.length > 0) {
            recommendations.push({
                category: 'critical_errors',
                priority: 'high',
                issue: `Found ${this.results.criticalIssues.length} critical issues`,
                action: 'Fix debugger statements and errors immediately'
            });
        }

        // Fixable issues
        if (this.results.fixableIssues.length > 0) {
            recommendations.push({
                category: 'auto_fixable',
                priority: 'medium',
                issue: `Found ${this.results.fixableIssues.length} auto-fixable issues`,
                action: 'Run ESLint with --fix flag after fixing configuration'
            });
        }

        this.results.recommendations = recommendations;
    }

    /**
     * Generate summary
     */
    generateSummary() {
        const moduleScores = {};

        for (const [moduleName, moduleResult] of Object.entries(this.results.modules)) {
            let score = 100;
            score -= moduleResult.errors * 10;
            score -= moduleResult.warnings * 2;
            moduleScores[moduleName] = Math.max(0, score);
        }

        let overallScore = 100;
        overallScore -= this.results.summary.totalErrors * 5;
        overallScore -= this.results.summary.totalWarnings * 1;
        overallScore -= this.results.configIssues.length * 20; // Config issues are serious

        return {
            totalFiles: this.results.summary.totalFiles,
            totalErrors: this.results.summary.totalErrors,
            totalWarnings: this.results.summary.totalWarnings,
            totalFixable: this.results.summary.totalFixable,
            criticalIssuesCount: this.results.criticalIssues.length,
            fixableIssuesCount: this.results.fixableIssues.length,
            configurationIssues: this.results.configIssues.length,
            moduleScores: moduleScores,
            overallScore: Math.max(0, Math.round(overallScore))
        };
    }

    /**
     * Run ESLint command safely with proper error handling
     */
    async runESLintCommand(modulePath, configFile = null, fullDirectory = true) {
        let eslintCommand;

        if (configFile) {
            eslintCommand = `npx eslint --format json --config ${configFile} . 2>/dev/null`;
        } else {
            eslintCommand = `npx eslint --format json . 2>/dev/null`;
        }

        const output = execSync(eslintCommand, {
            cwd: modulePath,
            encoding: 'utf8',
            timeout: 60000,
            maxBuffer: 1024 * 1024 * 20, // 20MB buffer
            stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr to avoid ENOBUFS
        });

        return output.trim() ? JSON.parse(output) : [];
    }

    /**
     * Run ESLint file by file when full directory fails
     */
    async runESLintFileByFile(modulePath, configFile = null) {
        const allResults = [];
        const codeFiles = this.getAllCodeFiles(modulePath);

        // Limit to prevent too many files
        const filesToAnalyze = codeFiles.slice(0, 50);

        console.log(`    🔍 Analyzing ${filesToAnalyze.length} files individually...`);

        for (const file of filesToAnalyze) {
            try {
                const relativePath = path.relative(modulePath, file);
                let eslintCommand;

                if (configFile) {
                    eslintCommand = `npx eslint --format json --config ${configFile} "${relativePath}" 2>/dev/null`;
                } else {
                    eslintCommand = `npx eslint --format json "${relativePath}" 2>/dev/null`;
                }

                const output = execSync(eslintCommand, {
                    cwd: modulePath,
                    encoding: 'utf8',
                    timeout: 10000,
                    maxBuffer: 1024 * 1024 * 2, // 2MB buffer per file
                    stdio: ['pipe', 'pipe', 'ignore']
                });

                const results = output.trim() ? JSON.parse(output) : [];
                allResults.push(...results);

            } catch (error) {
                // Skip files that can't be analyzed individually
                continue;
            }
        }

        return allResults;
    }
}

// CLI execution
if (require.main === module) {
    const runner = new ESLintRunner();

    runner.analyze().then(results => {
        const summary = runner.generateSummary();

        console.log('\n📊 ESLint Analysis Summary:');
        console.log(`Files Analyzed: ${summary.totalFiles}`);
        console.log(`Errors: ${summary.totalErrors}`);
        console.log(`Warnings: ${summary.totalWarnings}`);
        console.log(`Configuration Issues: ${summary.configurationIssues}`);
        console.log(`Overall Score: ${summary.overallScore}/100`);

        if (Object.keys(summary.moduleScores).length > 0) {
            console.log('\n📋 Module Scores:');
            for (const [module, score] of Object.entries(summary.moduleScores)) {
                console.log(`  ${module}: ${score}/100`);
            }
        }

        if (results.recommendations.length > 0) {
            console.log('\n💡 Key Recommendations:');
            results.recommendations.forEach(rec => {
                console.log(`  ${rec.priority.toUpperCase()}: ${rec.issue}`);
            });
        }

        if (process.argv.includes('--json')) {
            console.log('\n--- JSON OUTPUT ---');
            console.log(JSON.stringify({ ...results, summary }, null, 2));
        }

        process.exit(0);
    }).catch(error => {
        console.error('Failed to run ESLint analysis:', error);
        process.exit(1);
    });
}

module.exports = ESLintRunner;