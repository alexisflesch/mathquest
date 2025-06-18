#!/usr/bin/env node

/**
 * Navigation Graph Analyzer
 * 
 * Uses Puppeteer to dynamically explore the app's navigation graph and detect:
 * - Orphaned pages unreachable through normal user flows
 * - Defined routes that are not accessible
 * - Navigation inconsistencies between defined and actual routes
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class NavigationGraphAnalyzer {
    constructor(options = {}) {
        // Load global configuration
        this.loadGlobalConfig();

        this.baseUrl = options.baseUrl || this.globalConfig?.server_config?.frontend?.url || 'http://localhost:3008';

        // Auto-detect project root based on current directory
        if (__dirname.includes('quality-monitor')) {
            this.projectRoot = path.resolve(__dirname, '../../..');
        } else {
            this.projectRoot = path.resolve(__dirname, '../..');
        }

        console.log(`🔍 Project root: ${this.projectRoot}`);

        this.timeout = options.timeout || this.globalConfig?.analysis_config?.timeouts?.navigation_analysis || 30000;
        this.browser = null;
        this.page = null;

        // Results storage
        this.definedRoutes = new Set();
        this.accessibleRoutes = new Set();
        this.navigationGraph = new Map();
        this.orphanedPages = [];
        this.unreachableRoutes = [];
        this.errors = [];
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
        console.log('🗺️  Starting Navigation Graph Analysis...\n');

        try {
            // Step 1: Extract defined routes from code
            await this.extractDefinedRoutes();

            // Step 2: Launch browser and start exploration
            await this.setupBrowser();

            // Step 3: Explore navigation graph
            await this.exploreNavigationGraph();

            // Step 4: Analyze findings
            await this.analyzeFindings();

            // Step 5: Output results
            this.outputResults();

        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            this.errors.push(`Analysis failure: ${error.message}`);
        } finally {
            await this.cleanup();
        }
    }

    /**
     * Extract defined routes from Next.js pages and app router
     */
    async extractDefinedRoutes() {
        console.log('📋 Extracting defined routes...');

        // Check for Next.js app directory structure
        const appDir = path.join(this.projectRoot, 'frontend/src/app');
        const pagesDir = path.join(this.projectRoot, 'frontend/src/pages');

        if (fs.existsSync(appDir)) {
            await this.extractAppRouterRoutes(appDir);
        }

        if (fs.existsSync(pagesDir)) {
            await this.extractPagesRouterRoutes(pagesDir);
        }

        // Extract dynamic routes from route handlers
        await this.extractApiRoutes();

        console.log(`✅ Found ${this.definedRoutes.size} defined routes\n`);
    }

    /**
     * Extract routes from Next.js app directory
     */
    async extractAppRouterRoutes(appDir, basePath = '') {
        const entries = fs.readdirSync(appDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(appDir, entry.name);

            if (entry.isDirectory()) {
                // Handle dynamic routes [slug] and [...slug]
                let routePath = entry.name;
                if (routePath.startsWith('[') && routePath.endsWith(']')) {
                    routePath = routePath.startsWith('[...') ? '*' : ':slug';
                }

                const newBasePath = `${basePath}/${routePath}`;

                // Check if this directory has a page.tsx/jsx
                const pageFiles = ['page.tsx', 'page.jsx', 'page.ts', 'page.js'];
                const hasPage = pageFiles.some(file =>
                    fs.existsSync(path.join(fullPath, file))
                );

                if (hasPage) {
                    this.definedRoutes.add(newBasePath || '/');
                }

                // Recursively check subdirectories
                await this.extractAppRouterRoutes(fullPath, newBasePath);
            }
        }
    }

    /**
     * Extract routes from Next.js pages directory
     */
    async extractPagesRouterRoutes(pagesDir, basePath = '') {
        const entries = fs.readdirSync(pagesDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(pagesDir, entry.name);

            if (entry.isDirectory()) {
                await this.extractPagesRouterRoutes(fullPath, `${basePath}/${entry.name}`);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name);
                if (['.tsx', '.jsx', '.ts', '.js'].includes(ext)) {
                    const fileName = path.basename(entry.name, ext);

                    // Skip special Next.js files
                    if (['_app', '_document', '_error', '404', '500'].includes(fileName)) {
                        continue;
                    }

                    // Handle dynamic routes
                    let routePath = fileName;
                    if (routePath.startsWith('[') && routePath.endsWith(']')) {
                        routePath = routePath.startsWith('[...') ? '*' : ':slug';
                    }

                    const fullRoute = fileName === 'index' ? basePath || '/' : `${basePath}/${routePath}`;
                    this.definedRoutes.add(fullRoute);
                }
            }
        }
    }

    /**
     * Extract API routes
     */
    async extractApiRoutes() {
        const apiDirs = [
            path.join(this.projectRoot, 'frontend/src/pages/api'),
            path.join(this.projectRoot, 'frontend/src/app/api')
        ];

        for (const apiDir of apiDirs) {
            if (fs.existsSync(apiDir)) {
                await this.extractApiRoutesFromDir(apiDir, '/api');
            }
        }
    }

    /**
     * Extract API routes from directory
     */
    async extractApiRoutesFromDir(dir, basePath = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await this.extractApiRoutesFromDir(fullPath, `${basePath}/${entry.name}`);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name);
                if (['.tsx', '.jsx', '.ts', '.js'].includes(ext)) {
                    const fileName = path.basename(entry.name, ext);
                    const fullRoute = fileName === 'index' ? basePath : `${basePath}/${fileName}`;
                    this.definedRoutes.add(fullRoute);
                }
            }
        }
    }

    /**
     * Setup Puppeteer browser
     */
    async setupBrowser() {
        console.log('🚀 Launching browser...');

        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.page = await this.browser.newPage();

        // Set viewport and user agent
        await this.page.setViewport({ width: 1920, height: 1080 });
        await this.page.setUserAgent('NavigationAnalyzer/1.0 (+MathQuest-QualityMonitor)');

        // Setup error handling
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.errors.push(`Console error: ${msg.text()}`);
            }
        });

        this.page.on('pageerror', error => {
            this.errors.push(`Page error: ${error.message}`);
        });

        console.log('✅ Browser ready\n');
    }

    /**
     * Explore navigation graph starting from homepage
     */
    async exploreNavigationGraph() {
        console.log('🔍 Exploring navigation graph...');

        const visited = new Set();
        const toVisit = ['/'];

        while (toVisit.length > 0) {
            const currentRoute = toVisit.shift();

            if (visited.has(currentRoute)) continue;
            visited.add(currentRoute);

            try {
                const links = await this.exploreRoute(currentRoute);

                // Add newly discovered links to exploration queue
                for (const link of links) {
                    if (!visited.has(link) && !toVisit.includes(link)) {
                        toVisit.push(link);
                    }
                }

            } catch (error) {
                this.errors.push(`Failed to explore route ${currentRoute}: ${error.message}`);
            }
        }

        console.log(`✅ Explored ${visited.size} accessible routes\n`);
    }

    /**
     * Explore a specific route and extract navigation links
     */
    async exploreRoute(route) {
        const url = `${this.baseUrl}${route}`;
        const discoveredLinks = [];

        try {
            console.log(`   Exploring: ${route}`);

            await this.page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: this.timeout
            });

            // Mark route as accessible
            this.accessibleRoutes.add(route);

            // Extract all navigation links
            const links = await this.page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a[href]'));
                return anchors.map(anchor => ({
                    href: anchor.getAttribute('href'),
                    text: anchor.textContent.trim(),
                    visible: anchor.offsetParent !== null
                })).filter(link =>
                    link.href &&
                    link.visible &&
                    (link.href.startsWith('/') || link.href.startsWith(window.location.origin))
                );
            });

            // Process discovered links
            for (const link of links) {
                let href = link.href;

                // Normalize URLs
                if (href.startsWith(this.baseUrl)) {
                    href = href.substring(this.baseUrl.length);
                }

                // Remove query params and fragments for analysis
                const cleanHref = href.split('?')[0].split('#')[0];

                if (cleanHref && cleanHref !== route) {
                    discoveredLinks.push(cleanHref);

                    // Build navigation graph
                    if (!this.navigationGraph.has(route)) {
                        this.navigationGraph.set(route, []);
                    }
                    this.navigationGraph.get(route).push({
                        target: cleanHref,
                        text: link.text,
                        originalHref: link.href
                    });
                }
            }

            // Small delay to be respectful
            await this.page.waitForTimeout(100);

        } catch (error) {
            this.errors.push(`Route exploration failed for ${route}: ${error.message}`);
        }

        return discoveredLinks;
    }

    /**
     * Analyze findings to identify orphaned pages and unreachable routes
     */
    async analyzeFindings() {
        console.log('📊 Analyzing findings...');

        // Find orphaned pages (defined but not accessible via navigation)
        for (const definedRoute of this.definedRoutes) {
            if (!this.accessibleRoutes.has(definedRoute)) {
                // Skip API routes and special routes for orphan analysis
                if (!definedRoute.startsWith('/api/') &&
                    !definedRoute.includes(':slug') &&
                    !definedRoute.includes('*')) {
                    this.orphanedPages.push(definedRoute);
                }
            }
        }

        // Find unreachable routes (accessible but not defined)
        for (const accessibleRoute of this.accessibleRoutes) {
            if (!this.definedRoutes.has(accessibleRoute)) {
                // Check if it matches a dynamic route pattern
                const matchesDynamicRoute = Array.from(this.definedRoutes).some(defined =>
                    this.matchesDynamicRoute(accessibleRoute, defined)
                );

                if (!matchesDynamicRoute) {
                    this.unreachableRoutes.push(accessibleRoute);
                }
            }
        }

        console.log(`✅ Analysis complete\n`);
    }

    /**
     * Check if a route matches a dynamic route pattern
     */
    matchesDynamicRoute(actualRoute, definedRoute) {
        // Simple pattern matching for dynamic routes
        const definedParts = definedRoute.split('/');
        const actualParts = actualRoute.split('/');

        if (definedParts.length !== actualParts.length) {
            return false;
        }

        for (let i = 0; i < definedParts.length; i++) {
            const defined = definedParts[i];
            const actual = actualParts[i];

            if (defined === ':slug' || defined.startsWith('[')) {
                continue; // Dynamic segment matches anything
            }

            if (defined !== actual) {
                return false;
            }
        }

        return true;
    }

    /**
     * Cleanup browser resources
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    /**
     * Output analysis results
     */
    outputResults() {
        console.log('🗺️  NAVIGATION GRAPH ANALYSIS RESULTS\n');
        console.log('='.repeat(60));

        // Summary statistics
        console.log(`📊 SUMMARY:`);
        console.log(`   Defined routes: ${this.definedRoutes.size}`);
        console.log(`   Accessible routes: ${this.accessibleRoutes.size}`);
        console.log(`   Navigation links found: ${Array.from(this.navigationGraph.values()).reduce((sum, links) => sum + links.length, 0)}`);
        console.log(`   Errors encountered: ${this.errors.length}\n`);

        // Orphaned pages
        if (this.orphanedPages.length > 0) {
            console.log(`🔴 ORPHANED PAGES (${this.orphanedPages.length}):`);
            console.log('   Pages defined in code but not reachable via navigation:\n');
            this.orphanedPages.forEach((page, i) => {
                console.log(`   ${i + 1}. ${page}`);
            });
            console.log();
        }

        // Unreachable routes
        if (this.unreachableRoutes.length > 0) {
            console.log(`🟡 UNDEFINED ACCESSIBLE ROUTES (${this.unreachableRoutes.length}):`);
            console.log('   Routes accessible via navigation but not defined in code:\n');
            this.unreachableRoutes.forEach((route, i) => {
                console.log(`   ${i + 1}. ${route}`);
            });
            console.log();
        }

        // Navigation graph insights
        console.log(`📈 NAVIGATION INSIGHTS:`);
        const deadEndPages = Array.from(this.navigationGraph.entries())
            .filter(([route, links]) => links.length === 0)
            .map(([route]) => route);

        if (deadEndPages.length > 0) {
            console.log(`   Dead-end pages (no outgoing links): ${deadEndPages.length}`);
            deadEndPages.slice(0, 5).forEach(page => console.log(`     - ${page}`));
            if (deadEndPages.length > 5) {
                console.log(`     ... and ${deadEndPages.length - 5} more`);
            }
        }

        const highlyConnectedPages = Array.from(this.navigationGraph.entries())
            .sort(([, a], [, b]) => b.length - a.length)
            .slice(0, 3);

        if (highlyConnectedPages.length > 0) {
            console.log(`   Most connected pages:`);
            highlyConnectedPages.forEach(([route, links]) => {
                console.log(`     - ${route} (${links.length} outgoing links)`);
            });
        }

        // Errors
        if (this.errors.length > 0) {
            console.log(`\n⚠️  ERRORS ENCOUNTERED (${this.errors.length}):`);
            this.errors.slice(0, 10).forEach((error, i) => {
                console.log(`   ${i + 1}. ${error}`);
            });
            if (this.errors.length > 10) {
                console.log(`   ... and ${this.errors.length - 10} more errors`);
            }
        }

        console.log('\n' + '='.repeat(60));

        // Recommendations
        const recommendations = [];

        if (this.orphanedPages.length > 0) {
            recommendations.push('🔧 Add navigation links to orphaned pages or remove unused pages');
        }

        if (this.unreachableRoutes.length > 0) {
            recommendations.push('🔧 Define route handlers for accessible but undefined routes');
        }

        if (deadEndPages.length > 5) {
            recommendations.push('🔧 Consider adding navigation links to dead-end pages');
        }

        if (recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            recommendations.forEach((rec, i) => {
                console.log(`   ${i + 1}. ${rec}`);
            });
        } else {
            console.log('\n✅ Navigation graph looks healthy!');
        }
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i += 2) {
        if (args[i] === '--url') {
            options.baseUrl = args[i + 1];
        } else if (args[i] === '--timeout') {
            options.timeout = parseInt(args[i + 1]);
        }
    }

    const analyzer = new NavigationGraphAnalyzer(options);
    analyzer.analyze().catch(console.error);
}

module.exports = NavigationGraphAnalyzer;
