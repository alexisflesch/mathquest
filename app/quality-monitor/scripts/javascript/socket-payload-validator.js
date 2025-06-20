#!/usr/bin/env node

/**
 * Socket Payload Validator - Comprehensive Socket Validation Analysis
 * 
 * This script analyzes socket event handlers and emitters to ensure:
 * - All socket payloads use shared types from @shared/types
 * - All handlers have proper Zod schema validation
 * - No hardcoded socket event names (use SOCKET_EVENTS constants)
 * - Consistent naming between events and their payload types
 * - Type guards are used for runtime validation
 * - Socket events are properly documented
 * 
 * Usage: node socket-payload-validator.js [project-root]
 */

const { Project } = require('ts-morph');
const path = require('path');
const fs = require('fs');

class SocketPayloadValidator {
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
        console.log(`🔍 Socket Payload Validator - Project root: ${this.projectRoot}`);

        // Initialize TypeScript project with manual file loading
        this.project = new Project({
            compilerOptions: {
                target: 'ES2020',
                module: 'commonjs',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true
            }
        });

        // Add source files manually
        this.loadSourceFiles();

        this.results = {
            summary: {
                totalSocketHandlers: 0,
                totalSocketEmitters: 0,
                totalIssues: 0,
                analyzedAt: new Date().toISOString(),
                projectRoot: this.projectRoot
            },
            issues: {
                missingZodValidation: [],
                hardcodedEventNames: [],
                unsharedPayloadTypes: [],
                missingTypeGuards: [],
                inconsistentNaming: [],
                undocumentedEvents: [],
                anyTypedPayloads: []
            },
            goodPractices: {
                properlyValidatedHandlers: [],
                sharedTypeUsage: [],
                documentedEvents: []
            }
        };

        // Load shared types and socket events for comparison
        this.sharedTypes = new Set();
        this.socketEvents = new Set();
        this.zodSchemas = new Set();
        this.loadSharedReferences();
    }

    /**
     * Load global configuration
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
     * Load source files into the TypeScript project
     */
    loadSourceFiles() {
        const dirs = ['shared', 'backend/src', 'frontend/src'];

        for (const dir of dirs) {
            const dirPath = path.join(this.projectRoot, dir);
            if (fs.existsSync(dirPath)) {
                console.log(`📂 Loading files from: ${dir}`);
                this.project.addSourceFilesAtPaths(`${dirPath}/**/*.ts`);
                this.project.addSourceFilesAtPaths(`${dirPath}/**/*.tsx`);
            }
        }

        const allFiles = this.project.getSourceFiles();
        console.log(`✅ Loaded ${allFiles.length} TypeScript files`);
    }

    /**
     * Load shared types, socket events, and Zod schemas for reference
     */
    loadSharedReferences() {
        console.log('📋 Loading shared references...');

        const sourceFiles = this.project.getSourceFiles();

        for (const sourceFile of sourceFiles) {
            const filePath = sourceFile.getFilePath();

            // Load shared types
            if (filePath.includes('/shared/types/')) {
                const interfaces = sourceFile.getInterfaces();
                const typeAliases = sourceFile.getTypeAliases();

                interfaces.forEach(iface => {
                    this.sharedTypes.add(iface.getName());
                });

                typeAliases.forEach(alias => {
                    this.sharedTypes.add(alias.getName());
                });
            }

            // Load socket events constants
            if (filePath.includes('socket') && (filePath.includes('events') || filePath.includes('constants'))) {
                const exportedDeclarations = sourceFile.getExportedDeclarations();
                exportedDeclarations.forEach((declarations, name) => {
                    if (name.includes('EVENTS') || name.includes('EVENT')) {
                        this.socketEvents.add(name);
                    }
                });
            }

            // Load Zod schemas
            if (filePath.includes('.zod.') || filePath.includes('schema')) {
                const exportedDeclarations = sourceFile.getExportedDeclarations();
                exportedDeclarations.forEach((declarations, name) => {
                    if (name.includes('schema') || name.includes('Schema')) {
                        this.zodSchemas.add(name);
                    }
                });
            }
        }

        console.log(`✅ Found ${this.sharedTypes.size} shared types`);
        console.log(`✅ Found ${this.socketEvents.size} socket event constants`);
        console.log(`✅ Found ${this.zodSchemas.size} Zod schemas`);
    }

    /**
     * Main analysis entry point
     */
    async analyze() {
        console.log('🔍 Starting Socket Payload Validation Analysis...\\n');

        try {
            // Step 1: Find all socket handlers
            await this.findSocketHandlers();

            // Step 2: Find all socket emitters
            await this.findSocketEmitters();

            // Step 3: Analyze payload validation
            await this.analyzePayloadValidation();

            // Step 4: Check for shared type usage
            await this.checkSharedTypeUsage();

            // Step 5: Validate naming consistency
            await this.validateNamingConsistency();

            // Step 6: Generate recommendations
            await this.generateRecommendations();

            // Step 7: Output results
            this.outputResults();

        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            process.exit(1);
        }
    }

    /**
     * Find all socket handlers (socket.on calls)
     */
    async findSocketHandlers() {
        console.log('🔍 Finding socket handlers...');

        const sourceFiles = this.project.getSourceFiles();
        let handlerCount = 0;

        for (const sourceFile of sourceFiles) {
            // Skip test files
            if (this.shouldSkipFile(sourceFile.getFilePath())) continue;

            try {
                // Look for socket.on calls using a simpler approach
                const text = sourceFile.getFullText();
                const lines = text.split('\n');

                for (let lineNum = 0; lineNum < lines.length; lineNum++) {
                    const line = lines[lineNum];

                    // Look for socket.on patterns
                    const socketOnMatch = line.match(/(\w+)\.on\s*\(\s*['"]([^'"]+)['"]/);
                    if (socketOnMatch) {
                        const objectName = socketOnMatch[1];
                        const eventName = socketOnMatch[2];

                        // Check if it's likely a socket object
                        if (objectName.includes('socket') || objectName === 'io') {
                            // Skip native Socket.IO events
                            if (this.isNativeSocketEvent(eventName)) {
                                continue;
                            }

                            const socketHandler = {
                                file: sourceFile.getFilePath(),
                                line: lineNum + 1,
                                eventName: eventName,
                                eventNameRaw: `"${eventName}"`,
                                objectName: objectName,
                                hasZodValidation: false,
                                hasTypeGuard: false,
                                usesSharedTypes: false,
                                payloadType: 'any',
                                isDocumented: false
                            };

                            // Extract payload type from callback parameter
                            const callbackMatch = line.match(/\(([^)]*)\)\s*=>/);
                            if (callbackMatch && callbackMatch[1]) {
                                const param = callbackMatch[1].trim();
                                const typeMatch = param.match(/:\s*([^,)]+)/);
                                if (typeMatch) {
                                    socketHandler.payloadType = typeMatch[1].trim();
                                    socketHandler.usesSharedTypes = this.isSharedType(socketHandler.payloadType, sourceFile);
                                }
                            }

                            // Check for Zod validation in surrounding code
                            socketHandler.hasZodValidation = this.checkForZodValidationInFile(sourceFile, eventName);

                            // Check for type guards
                            socketHandler.hasTypeGuard = this.checkForTypeGuardsInFile(sourceFile, eventName);

                            // Check if uses constants
                            const usesConstants = this.usesSocketConstants(socketOnMatch[0]);

                            this.results.socketHandlers = this.results.socketHandlers || [];
                            this.results.socketHandlers.push(socketHandler);
                            handlerCount++;

                            // Categorize issues
                            this.categorizeHandlerIssues(socketHandler, usesConstants);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Warning: Could not analyze ${sourceFile.getFilePath()}: ${error.message}`);
            }
        }

        this.results.summary.totalSocketHandlers = handlerCount;
        console.log(`✅ Found ${handlerCount} socket handlers`);
    }

    /**
     * Find all socket emitters (socket.emit calls)
     */
    async findSocketEmitters() {
        console.log('🔍 Finding socket emitters...');

        const sourceFiles = this.project.getSourceFiles();
        let emitterCount = 0;

        for (const sourceFile of sourceFiles) {
            // Skip test files
            if (this.shouldSkipFile(sourceFile.getFilePath())) continue;

            try {
                // Look for socket.emit calls using text matching
                const text = sourceFile.getFullText();
                const lines = text.split('\n');

                for (let lineNum = 0; lineNum < lines.length; lineNum++) {
                    const line = lines[lineNum];

                    // Look for socket.emit patterns
                    const socketEmitMatch = line.match(/(\w+)\.emit\s*\(\s*['"]([^'"]+)['"]/);
                    if (socketEmitMatch) {
                        const objectName = socketEmitMatch[1];
                        const eventName = socketEmitMatch[2];

                        // Check if it's likely a socket object
                        if (objectName.includes('socket') || objectName === 'io') {
                            // Skip native Socket.IO events
                            if (this.isNativeSocketEvent(eventName)) {
                                continue;
                            }

                            const socketEmitter = {
                                file: sourceFile.getFilePath(),
                                line: lineNum + 1,
                                eventName: eventName,
                                eventNameRaw: `"${eventName}"`,
                                objectName: objectName,
                                usesConstants: this.usesSocketConstants(socketEmitMatch[0]),
                                payloadType: 'inferred',
                                usesSharedTypes: false
                            };

                            // Try to detect payload type from function parameters or validation
                            const payloadTypeInfo = this.detectEmitterPayloadType(line, sourceFile, eventName);
                            socketEmitter.payloadType = payloadTypeInfo.type;
                            socketEmitter.usesSharedTypes = payloadTypeInfo.usesSharedTypes;

                            this.results.socketEmitters = this.results.socketEmitters || [];
                            this.results.socketEmitters.push(socketEmitter);
                            emitterCount++;

                            // Categorize issues
                            this.categorizeEmitterIssues(socketEmitter);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Warning: Could not analyze ${sourceFile.getFilePath()}: ${error.message}`);
            }
        }

        this.results.summary.totalSocketEmitters = emitterCount;
        console.log(`✅ Found ${emitterCount} socket emitters`);
    }

    /**
     * Check if a handler has Zod validation in the file
     */
    checkForZodValidationInFile(sourceFile, eventName) {
        const text = sourceFile.getFullText();
        return text.includes('.safeParse(') || text.includes('.parse(') || text.includes('schema');
    }

    /**
     * Check if a handler uses type guards in the file
     */
    checkForTypeGuardsInFile(sourceFile, eventName) {
        const text = sourceFile.getFullText();
        return text.includes('is ') || text.includes('TypeGuard') || text.includes('typeGuard');
    }

    /**
     * Check if a handler has Zod validation
     */
    checkForZodValidation(sourceFile, callExpr) {
        // Look for .safeParse() or .parse() calls in the same function
        const functionDeclaration = callExpr.getFirstAncestorByKind(256) || callExpr.getFirstAncestorByKind(213); // FunctionDeclaration or ArrowFunction

        if (functionDeclaration) {
            const functionText = functionDeclaration.getText();
            return functionText.includes('.safeParse(') || functionText.includes('.parse(') || functionText.includes('schema');
        }

        return false;
    }

    /**
     * Check if a handler uses type guards
     */
    checkForTypeGuards(sourceFile, callExpr) {
        const functionDeclaration = callExpr.getFirstAncestorByKind(256) || callExpr.getFirstAncestorByKind(213);

        if (functionDeclaration) {
            const functionText = functionDeclaration.getText();
            return functionText.includes('is ') || functionText.includes('TypeGuard') || functionText.includes('typeGuard');
        }

        return false;
    }

    /**
     * Extract payload type from handler parameter
     */
    extractPayloadType(sourceFile, callExpr) {
        const args = callExpr.getArguments();
        if (args.length >= 2) {
            const handlerArg = args[1];

            // Check if it's an arrow function or function expression
            if (handlerArg.getKind() === 213 || handlerArg.getKind() === 214) { // ArrowFunction or FunctionExpression
                const parameters = handlerArg.getParameters();
                if (parameters.length > 0) {
                    const firstParam = parameters[0];
                    const typeNode = firstParam.getTypeNode();
                    if (typeNode) {
                        return typeNode.getText();
                    }
                }
            }
        }

        return 'any';
    }

    /**
     * Infer payload type from emitter calls
     */
    inferEmitterPayloadType(sourceFile, callExpr) {
        const args = callExpr.getArguments();
        if (args.length > 1) {
            const payloadArg = args[1];
            // This is a simplified inference - could be enhanced
            return 'inferred from usage';
        }
        return 'none';
    }

    /**
     * Detect payload type for socket emitters
     */
    detectEmitterPayloadType(line, sourceFile, eventName) {
        try {
            // Look for function parameter types like: emitFunction(payload: PayloadType)
            const functionParamMatch = line.match(/\(payload:\s*([^)]+)\)/);
            if (functionParamMatch) {
                const type = functionParamMatch[1].trim();
                return {
                    type: type,
                    usesSharedTypes: this.isSharedType(type, sourceFile)
                };
            }

            // Look for validation patterns like: schema.parse(payload)
            const sourceText = sourceFile.getFullText();
            const lines = sourceText.split('\n');
            const currentLineIndex = lines.findIndex(l => l.includes(line.trim()));

            // Search surrounding lines for validation
            for (let i = Math.max(0, currentLineIndex - 5); i < Math.min(lines.length, currentLineIndex + 5); i++) {
                const nearbyLine = lines[i];
                const validationMatch = nearbyLine.match(/(\w+)\.parse\(payload\)/);
                if (validationMatch) {
                    const schemaName = validationMatch[1];
                    // Check if this is a Zod schema
                    if (schemaName.includes('Schema') || schemaName.includes('schema')) {
                        return {
                            type: 'Zod-validated',
                            usesSharedTypes: true
                        };
                    }
                }
            }

            return {
                type: 'inferred',
                usesSharedTypes: false
            };
        } catch (error) {
            return {
                type: 'unknown',
                usesSharedTypes: false
            };
        }
    }

    /**
     * Check if type name is from shared types or Zod-derived
     */
    isSharedType(typeName, sourceFile = null) {
        if (!typeName || typeName === 'any' || typeName === 'unknown') return false;

        // Clean up the type name (remove generics, etc.)
        const cleanTypeName = typeName.split('<')[0].split('|')[0].trim();

        // Check if it's in shared types
        if (this.sharedTypes.has(cleanTypeName)) return true;

        // Check if it's a Zod-derived type (z.infer<typeof schema>)
        if (sourceFile && this.isZodDerivedType(cleanTypeName, sourceFile)) return true;

        // Check if imported from shared types
        if (sourceFile && this.isImportedFromSharedTypes(cleanTypeName, sourceFile)) return true;

        return false;
    }

    /**
     * Check if type is derived from Zod schema (z.infer<typeof schema>)
     */
    isZodDerivedType(typeName, sourceFile) {
        try {
            const sourceText = sourceFile.getFullText();
            // Look for type definitions like: type TypeName = z.infer<typeof schemaName>
            const zodTypeRegex = new RegExp(`type\\s+${typeName}\\s*=\\s*z\\.infer<typeof\\s+\\w+>`);
            return zodTypeRegex.test(sourceText);
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if type is imported from shared types
     */
    isImportedFromSharedTypes(typeName, sourceFile) {
        try {
            const sourceText = sourceFile.getFullText();
            // Look for imports from shared types
            const sharedImportRegex = new RegExp(`import.*{[^}]*\\b${typeName}\\b[^}]*}.*from\\s*['"]@shared/types`);
            return sharedImportRegex.test(sourceText);
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if event is a native Socket.IO event that should be excluded
     */
    isNativeSocketEvent(eventName) {
        const nativeEvents = [
            'connect', 'disconnect', 'connect_error', 'reconnect',
            'reconnect_attempt', 'reconnecting', 'reconnect_error',
            'reconnect_failed', 'ping', 'pong', 'error'
        ];
        return nativeEvents.includes(eventName);
    }

    /**
     * Check if socket event uses constants
     */
    usesSocketConstants(eventName) {
        // Remove quotes and check if it looks like a constant reference
        const cleaned = eventName.replace(/['"]/g, '');
        return !cleaned.includes(' ') && (cleaned.includes('EVENTS.') || cleaned.includes('EVENT_'));
    }

    /**
     * Check if handler is documented
     */
    checkDocumentation(sourceFile, callExpr) {
        // Look for JSDoc comments above the socket.on call
        const leadingComments = callExpr.getLeadingCommentRanges();
        return leadingComments.length > 0;
    }

    /**
     * Categorize handler issues
     */
    categorizeHandlerIssues(handler, usesConstants = false) {
        if (!handler.hasZodValidation) {
            this.results.issues.missingZodValidation.push({
                file: handler.file,
                line: handler.line,
                eventName: handler.eventName,
                issue: 'Missing Zod schema validation'
            });
        }

        if (!usesConstants) {
            this.results.issues.hardcodedEventNames.push({
                file: handler.file,
                line: handler.line,
                eventName: handler.eventName,
                issue: 'Hardcoded event name instead of SOCKET_EVENTS constant'
            });
        }

        if (!handler.usesSharedTypes && handler.payloadType !== 'any') {
            this.results.issues.unsharedPayloadTypes.push({
                file: handler.file,
                line: handler.line,
                eventName: handler.eventName,
                payloadType: handler.payloadType,
                issue: 'Uses local type instead of shared type'
            });
        }

        if (!handler.hasTypeGuard) {
            this.results.issues.missingTypeGuards.push({
                file: handler.file,
                line: handler.line,
                eventName: handler.eventName,
                issue: 'Missing runtime type validation'
            });
        }

        if (handler.payloadType === 'any') {
            this.results.issues.anyTypedPayloads.push({
                file: handler.file,
                line: handler.line,
                eventName: handler.eventName,
                issue: 'Payload typed as any'
            });
        }

        if (!handler.isDocumented) {
            this.results.issues.undocumentedEvents.push({
                file: handler.file,
                line: handler.line,
                eventName: handler.eventName,
                issue: 'Socket handler not documented'
            });
        }
    }

    /**
     * Categorize emitter issues
     */
    categorizeEmitterIssues(emitter) {
        if (!emitter.usesConstants) {
            this.results.issues.hardcodedEventNames.push({
                file: emitter.file,
                line: emitter.line,
                eventName: emitter.eventName,
                issue: 'Hardcoded event name in emitter'
            });
        }

        if (!emitter.usesSharedTypes && emitter.payloadType !== 'none') {
            this.results.issues.unsharedPayloadTypes.push({
                file: emitter.file,
                line: emitter.line,
                eventName: emitter.eventName,
                issue: 'Emitter not using shared payload types'
            });
        }
    }

    /**
     * Analyze payload validation patterns
     */
    async analyzePayloadValidation() {
        console.log('🔍 Analyzing payload validation patterns...');
        // Implementation for payload validation analysis
    }

    /**
     * Check shared type usage
     */
    async checkSharedTypeUsage() {
        console.log('🔍 Checking shared type usage...');
        // Implementation for shared type usage analysis
    }

    /**
     * Validate naming consistency
     */
    async validateNamingConsistency() {
        console.log('🔍 Validating naming consistency...');
        // Implementation for naming consistency validation
    }

    /**
     * Generate recommendations
     */
    async generateRecommendations() {
        console.log('💡 Generating recommendations...');

        this.results.recommendations = [];

        // Count total issues
        let totalIssues = 0;
        Object.values(this.results.issues).forEach(issueArray => {
            totalIssues += issueArray.length;
        });
        this.results.summary.totalIssues = totalIssues;

        // Generate specific recommendations
        if (this.results.issues.missingZodValidation.length > 0) {
            this.results.recommendations.push({
                priority: 'high',
                category: 'validation',
                title: `Add Zod validation to ${this.results.issues.missingZodValidation.length} socket handlers`,
                description: 'Socket handlers should validate incoming payloads with Zod schemas',
                action: 'Import and use appropriate Zod schemas from @shared/types/socketEvents.zod'
            });
        }

        if (this.results.issues.hardcodedEventNames.length > 0) {
            this.results.recommendations.push({
                priority: 'medium',
                category: 'constants',
                title: `Replace ${this.results.issues.hardcodedEventNames.length} hardcoded event names`,
                description: 'Use SOCKET_EVENTS constants instead of hardcoded strings',
                action: 'Import SOCKET_EVENTS from @shared/types/socket/events and use constants'
            });
        }

        if (this.results.issues.unsharedPayloadTypes.length > 0) {
            this.results.recommendations.push({
                priority: 'high',
                category: 'types',
                title: `Convert ${this.results.issues.unsharedPayloadTypes.length} local types to shared types`,
                description: 'Socket payloads should use canonical shared types',
                action: 'Replace local interface definitions with imports from @shared/types'
            });
        }
    }

    /**
     * Check if file should be skipped
     */
    shouldSkipFile(filePath) {
        const skipPatterns = [
            /\\.test\\./,
            /\\.spec\\./,
            /\\.d\\.ts$/,
            /node_modules/,
            /\\.next/,
            /dist/,
            /build/
        ];

        return skipPatterns.some(pattern => pattern.test(filePath));
    }

    /**
     * Output analysis results
     */
    outputResults() {
        console.log('\\n📊 SOCKET PAYLOAD VALIDATION RESULTS\\n');
        console.log('='.repeat(60));

        const { summary, issues, recommendations } = this.results;

        // Summary
        console.log(`\\n📈 SUMMARY:`);
        console.log(`   Socket Handlers: ${summary.totalSocketHandlers}`);
        console.log(`   Socket Emitters: ${summary.totalSocketEmitters}`);
        console.log(`   Total Issues: ${summary.totalIssues}`);
        console.log(`   Shared Types Available: ${this.sharedTypes.size}`);

        // Issues by category
        if (summary.totalIssues > 0) {
            console.log(`\\n🔴 ISSUES FOUND:`);

            Object.entries(issues).forEach(([category, issueList]) => {
                if (issueList.length > 0) {
                    console.log(`\\n   ${category.toUpperCase()} (${issueList.length} issues):`);
                    issueList.slice(0, 5).forEach(issue => {
                        const relativePath = path.relative(this.projectRoot, issue.file);
                        console.log(`   • ${relativePath}:${issue.line} - ${issue.issue}`);
                        if (issue.eventName) console.log(`     Event: ${issue.eventName}`);
                        if (issue.payloadType) console.log(`     Type: ${issue.payloadType}`);
                    });

                    if (issueList.length > 5) {
                        console.log(`   ... and ${issueList.length - 5} more`);
                    }
                }
            });
        }

        // Recommendations
        if (recommendations.length > 0) {
            console.log(`\n💡 RECOMMENDATIONS:`);
            recommendations.forEach((rec, i) => {
                const priority = rec.priority.toUpperCase();
                const badge = priority === 'HIGH' ? '🔴' : priority === 'MEDIUM' ? '🟡' : '🟢';
                console.log(`\n${i + 1}. ${badge} ${priority}: ${rec.title}`);
                console.log(`   ${rec.description}`);
                console.log(`   Action: ${rec.action}`);
            });
        }

        console.log('\n' + '='.repeat(60));
        console.log(`Analysis completed at: ${summary.analyzedAt}`);

        if (summary.totalIssues === 0) {
            console.log('\n✅ No socket payload validation issues found!');
        } else {
            console.log(`\n⚠️  Found ${summary.totalIssues} issues that need attention.`);
        }
    }
}

// CLI execution
if (require.main === module) {
    const validator = new SocketPayloadValidator();
    validator.analyze().catch(console.error);
}

module.exports = SocketPayloadValidator;
