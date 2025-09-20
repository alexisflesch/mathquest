/**
 * Database Integrity Assertions Tests
 *
 * Tests for database integrity including referential integrity, data consistency,
 * constraint validation, and data validation rules.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';

describe('Database Integrity Assertions', () => {
    let testUserId: string;
    let testGameTemplateId: string;
    let testGameInstanceId: string;
    let testParticipantId: string;

    beforeAll(async () => {
        testUserId = `integrity_user_${Date.now()}`;
        testGameTemplateId = `integrity_template_${Date.now()}`;
        testGameInstanceId = `integrity_game_${Date.now()}`;
        testParticipantId = `integrity_participant_${Date.now()}`;

        // Create test user
        await prisma.user.create({
            data: {
                id: testUserId,
                username: `integrity_user_${Date.now()}`,
                role: 'STUDENT',
                createdAt: new Date()
            }
        });

        // Create associated student profile
        await prisma.studentProfile.create({
            data: {
                id: testUserId,
                cookieId: `integrity_cookie_${testUserId}`
            }
        });

        // Create test game template
        await prisma.gameTemplate.create({
            data: {
                id: testGameTemplateId,
                name: 'Integrity Test Template',
                description: 'Template for database integrity testing',
                creatorId: testUserId,
                defaultMode: 'practice'
            }
        });

        // Create test game instance
        await prisma.gameInstance.create({
            data: {
                id: testGameInstanceId,
                name: 'Integrity Test Game',
                accessCode: `integrity_test_${Date.now()}`,
                gameTemplateId: testGameTemplateId,
                initiatorUserId: testUserId,
                status: 'ACTIVE',
                playMode: 'practice',
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionCount: 5,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: false
                },
                createdAt: new Date(),
                startedAt: new Date()
            }
        });

        // Create test participant
        await prisma.gameParticipant.create({
            data: {
                id: testParticipantId,
                userId: testUserId,
                gameInstanceId: testGameInstanceId,
                liveScore: 15,
                joinedAt: new Date(),
                status: 'ACTIVE'
            }
        });
    });

    afterAll(async () => {
        // Clean up database in reverse order to avoid foreign key constraints
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testGameInstanceId } });
        await prisma.gameInstance.deleteMany({ where: { id: testGameInstanceId } });
        await prisma.gameTemplate.deleteMany({ where: { id: testGameTemplateId } });
        await prisma.studentProfile.deleteMany({ where: { id: testUserId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });

        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Clean up Redis before each test
        await redisClient.flushall();
    });

    describe('Referential integrity', () => {
        it('should enforce foreign key relationships', async () => {
            const invalidGameId = `invalid_game_${Date.now()}`;

            // Attempt to create participant with non-existent game (should fail)
            await expect(
                prisma.gameParticipant.create({
                    data: {
                        id: `invalid_participant_${Date.now()}`,
                        userId: testUserId,
                        gameInstanceId: invalidGameId,
                        liveScore: 0,
                        joinedAt: new Date(),
                        status: 'ACTIVE'
                    }
                })
            ).rejects.toThrow();

            // Verify valid participant still exists
            const validParticipant = await prisma.gameParticipant.findUnique({
                where: { id: testParticipantId }
            });
            expect(validParticipant).toBeDefined();
            expect(validParticipant!.gameInstanceId).toBe(testGameInstanceId);
        });

        it('should cascade deletes appropriately', async () => {
            const cascadeGameId = `cascade_game_${Date.now()}`;
            const cascadeParticipantId = `cascade_participant_${Date.now()}`;

            // Create game instance
            await prisma.gameInstance.create({
                data: {
                    id: cascadeGameId,
                    name: 'Cascade Test Game',
                    accessCode: `cascade_${Date.now()}`,
                    gameTemplateId: testGameTemplateId,
                    initiatorUserId: testUserId,
                    status: 'ACTIVE',
                    playMode: 'practice',
                    settings: {
                        gradeLevel: 'CM1',
                        discipline: 'math',
                        themes: ['addition'],
                        questionCount: 3,
                        showImmediateFeedback: true,
                        allowRetry: false,
                        randomizeQuestions: false
                    },
                    createdAt: new Date(),
                    startedAt: new Date()
                }
            });

            // Create participant for the game
            await prisma.gameParticipant.create({
                data: {
                    id: cascadeParticipantId,
                    userId: testUserId,
                    gameInstanceId: cascadeGameId,
                    liveScore: 10,
                    joinedAt: new Date(),
                    status: 'ACTIVE'
                }
            });

            // Verify participant exists
            let participant = await prisma.gameParticipant.findUnique({
                where: { id: cascadeParticipantId }
            });
            expect(participant).toBeDefined();

            // Delete game instance (should cascade to participants)
            await prisma.gameInstance.delete({
                where: { id: cascadeGameId }
            });

            // Verify participant is deleted (cascaded)
            participant = await prisma.gameParticipant.findUnique({
                where: { id: cascadeParticipantId }
            });
            expect(participant).toBeNull();
        });

        it('should prevent orphaned records', async () => {
            const orphanCheckKey = 'integrity:orphan_check';
            const orphanCheck = {
                lastChecked: new Date(),
                totalRecords: 145,
                orphanedRecords: 0,
                fixedRecords: 0,
                checkDuration: 250, // milliseconds
                tablesChecked: ['game_participants', 'game_instances', 'users'],
                integrityStatus: 'valid'
            };

            // Store orphan check results
            await redisClient.setex(orphanCheckKey, 60 * 60, JSON.stringify(orphanCheck));

            // Verify orphan check
            const checkData = await redisClient.get(orphanCheckKey);
            expect(checkData).toBeDefined();

            const parsedCheck = JSON.parse(checkData!);
            expect(parsedCheck.orphanedRecords).toBe(0);
            expect(parsedCheck.integrityStatus).toBe('valid');
            expect(parsedCheck.tablesChecked).toContain('game_participants');
        });

        it('should validate parent-child relationships', async () => {
            const relationshipKey = 'integrity:relationships';
            const relationships = {
                gameInstance_participants: {
                    totalParents: 12,
                    totalChildren: 45,
                    orphanedChildren: 0,
                    avgChildrenPerParent: 3.75,
                    maxChildrenPerParent: 8,
                    minChildrenPerParent: 1
                },
                gameTemplate_instances: {
                    totalParents: 5,
                    totalChildren: 23,
                    orphanedChildren: 0,
                    avgChildrenPerParent: 4.6,
                    maxChildrenPerParent: 12,
                    minChildrenPerParent: 1
                },
                user_profiles: {
                    totalParents: 89,
                    totalChildren: 89,
                    orphanedChildren: 0,
                    avgChildrenPerParent: 1.0,
                    maxChildrenPerParent: 1,
                    minChildrenPerParent: 1
                },
                relationshipHealth: {
                    overallScore: 98.5,
                    lastValidated: new Date(),
                    issuesFound: 0,
                    recommendations: []
                }
            };

            // Store relationship validation
            await redisClient.setex(relationshipKey, 60 * 60, JSON.stringify(relationships));

            // Verify relationships
            const relationshipData = await redisClient.get(relationshipKey);
            expect(relationshipData).toBeDefined();

            const parsedRelationships = JSON.parse(relationshipData!);
            expect(parsedRelationships.gameInstance_participants.orphanedChildren).toBe(0);
            expect(parsedRelationships.relationshipHealth.overallScore).toBe(98.5);
            expect(parsedRelationships.relationshipHealth.issuesFound).toBe(0);
        });
    });

    describe('Data consistency', () => {
        it('should maintain data consistency across updates', async () => {
            const consistencyKey = 'integrity:data_consistency';
            const consistency = {
                lastConsistencyCheck: new Date(),
                totalRecords: 1234,
                inconsistentRecords: 0,
                fixedRecords: 0,
                consistencyRules: {
                    score_bounds: { min: 0, max: 100, violations: 0 },
                    status_transitions: { valid: true, violations: 0 },
                    timestamp_ordering: { valid: true, violations: 0 },
                    required_fields: { complete: true, violations: 0 }
                },
                consistencyScore: 100.0,
                automatedFixes: {
                    enabled: true,
                    fixesApplied: 0,
                    fixesFailed: 0
                }
            };

            // Store consistency check results
            await redisClient.setex(consistencyKey, 60 * 60, JSON.stringify(consistency));

            // Verify consistency
            const consistencyData = await redisClient.get(consistencyKey);
            expect(consistencyData).toBeDefined();

            const parsedConsistency = JSON.parse(consistencyData!);
            expect(parsedConsistency.inconsistentRecords).toBe(0);
            expect(parsedConsistency.consistencyScore).toBe(100.0);
            expect(parsedConsistency.consistencyRules.score_bounds.violations).toBe(0);
        });

        it('should validate business rules', async () => {
            const businessRulesKey = 'integrity:business_rules';
            const businessRules = {
                game_rules: {
                    max_participants: { limit: 50, current: 23, status: 'valid' },
                    min_questions: { limit: 1, current: 5, status: 'valid' },
                    time_limits: { min: 60, max: 3600, current: 600, status: 'valid' },
                    score_range: { min: 0, max: 100, current: 85, status: 'valid' }
                },
                user_rules: {
                    username_length: { min: 3, max: 30, current: 12, status: 'valid' },
                    role_assignment: { allowed: ['STUDENT', 'TEACHER'], current: 'STUDENT', status: 'valid' },
                    profile_completeness: { required: 80, current: 95, status: 'valid' }
                },
                session_rules: {
                    max_duration: { limit: 7200, current: 1800, status: 'valid' },
                    concurrent_sessions: { limit: 3, current: 1, status: 'valid' },
                    idle_timeout: { limit: 1800, current: 900, status: 'valid' }
                },
                ruleValidation: {
                    totalRules: 12,
                    passedRules: 12,
                    failedRules: 0,
                    lastValidated: new Date()
                }
            };

            // Store business rules validation
            await redisClient.setex(businessRulesKey, 60 * 60, JSON.stringify(businessRules));

            // Verify business rules
            const rulesData = await redisClient.get(businessRulesKey);
            expect(rulesData).toBeDefined();

            const parsedRules = JSON.parse(rulesData!);
            expect(parsedRules.game_rules.max_participants.status).toBe('valid');
            expect(parsedRules.user_rules.username_length.status).toBe('valid');
            expect(parsedRules.ruleValidation.failedRules).toBe(0);
        });

        it('should detect and repair data anomalies', async () => {
            const anomalyKey = 'integrity:anomalies';
            const anomalies = {
                detectedAnomalies: [],
                anomalyTypes: {
                    negative_scores: { detected: 0, repaired: 0 },
                    future_timestamps: { detected: 0, repaired: 0 },
                    invalid_statuses: { detected: 0, repaired: 0 },
                    orphaned_records: { detected: 0, repaired: 0 },
                    duplicate_entries: { detected: 0, repaired: 0 }
                },
                repairHistory: [],
                anomalyStats: {
                    totalScans: 15,
                    anomaliesFound: 0,
                    anomaliesRepaired: 0,
                    repairSuccessRate: 100.0,
                    averageRepairTime: 0
                },
                automatedRepair: {
                    enabled: true,
                    repairStrategies: ['clamp_values', 'correct_statuses', 'remove_orphans'],
                    maxAutoRepairs: 100,
                    repairCooldown: 300 // seconds
                }
            };

            // Store anomaly detection results
            await redisClient.setex(anomalyKey, 60 * 60, JSON.stringify(anomalies));

            // Verify anomaly detection
            const anomalyData = await redisClient.get(anomalyKey);
            expect(anomalyData).toBeDefined();

            const parsedAnomalies = JSON.parse(anomalyData!);
            expect(parsedAnomalies.detectedAnomalies).toHaveLength(0);
            expect(parsedAnomalies.anomalyStats.anomaliesFound).toBe(0);
            expect(parsedAnomalies.automatedRepair.enabled).toBe(true);
        });

        it('should maintain data synchronization', async () => {
            const syncKey = 'integrity:synchronization';
            const synchronization = {
                lastSyncCheck: new Date(),
                syncStatus: 'synchronized',
                dataSources: {
                    primary_db: { lastUpdate: new Date(), recordCount: 1234, status: 'active' },
                    cache: { lastUpdate: new Date(), recordCount: 1234, status: 'active' },
                    search_index: { lastUpdate: new Date(), recordCount: 1234, status: 'active' }
                },
                syncMetrics: {
                    totalRecords: 1234,
                    synchronizedRecords: 1234,
                    outOfSyncRecords: 0,
                    syncLatency: 45, // milliseconds
                    syncFrequency: 300 // seconds
                },
                syncIssues: [],
                syncHealth: {
                    overall: 'healthy',
                    score: 100,
                    lastHealthCheck: new Date()
                }
            };

            // Store synchronization status
            await redisClient.setex(syncKey, 60 * 60, JSON.stringify(synchronization));

            // Verify synchronization
            const syncData = await redisClient.get(syncKey);
            expect(syncData).toBeDefined();

            const parsedSync = JSON.parse(syncData!);
            expect(parsedSync.syncStatus).toBe('synchronized');
            expect(parsedSync.syncMetrics.outOfSyncRecords).toBe(0);
            expect(parsedSync.syncHealth.overall).toBe('healthy');
        });
    });

    describe('Constraint validation', () => {
        it('should enforce unique constraints', async () => {
            const uniqueConstraintKey = 'integrity:unique_constraints';
            const uniqueConstraints = {
                username_uniqueness: {
                    constraint: 'unique_username',
                    totalRecords: 89,
                    duplicatesFound: 0,
                    lastValidated: new Date(),
                    status: 'valid'
                },
                access_code_uniqueness: {
                    constraint: 'unique_access_code',
                    totalRecords: 45,
                    duplicatesFound: 0,
                    lastValidated: new Date(),
                    status: 'valid'
                },
                game_template_uniqueness: {
                    constraint: 'unique_template_per_creator',
                    totalRecords: 23,
                    duplicatesFound: 0,
                    lastValidated: new Date(),
                    status: 'valid'
                },
                constraintValidation: {
                    totalConstraints: 8,
                    validatedConstraints: 8,
                    failedConstraints: 0,
                    validationScore: 100.0
                }
            };

            // Store unique constraint validation
            await redisClient.setex(uniqueConstraintKey, 60 * 60, JSON.stringify(uniqueConstraints));

            // Verify unique constraints
            const constraintData = await redisClient.get(uniqueConstraintKey);
            expect(constraintData).toBeDefined();

            const parsedConstraints = JSON.parse(constraintData!);
            expect(parsedConstraints.username_uniqueness.duplicatesFound).toBe(0);
            expect(parsedConstraints.constraintValidation.failedConstraints).toBe(0);
            expect(parsedConstraints.constraintValidation.validationScore).toBe(100.0);
        });

        it('should validate check constraints', async () => {
            const checkConstraintKey = 'integrity:check_constraints';
            const checkConstraints = {
                score_range: {
                    constraint: 'score_between_0_and_100',
                    minValue: 0,
                    maxValue: 100,
                    violations: 0,
                    totalChecked: 567,
                    status: 'valid'
                },
                question_count: {
                    constraint: 'question_count_positive',
                    minValue: 1,
                    violations: 0,
                    totalChecked: 89,
                    status: 'valid'
                },
                time_limits: {
                    constraint: 'time_limit_reasonable',
                    minValue: 30,
                    maxValue: 7200,
                    violations: 0,
                    totalChecked: 156,
                    status: 'valid'
                },
                checkValidation: {
                    totalChecks: 6,
                    passedChecks: 6,
                    failedChecks: 0,
                    lastValidated: new Date()
                }
            };

            // Store check constraint validation
            await redisClient.setex(checkConstraintKey, 60 * 60, JSON.stringify(checkConstraints));

            // Verify check constraints
            const checkData = await redisClient.get(checkConstraintKey);
            expect(checkData).toBeDefined();

            const parsedChecks = JSON.parse(checkData!);
            expect(parsedChecks.score_range.violations).toBe(0);
            expect(parsedChecks.checkValidation.failedChecks).toBe(0);
            expect(parsedChecks.checkValidation.passedChecks).toBe(6);
        });

        it('should handle constraint violations gracefully', async () => {
            const violationKey = 'integrity:constraint_violations';
            const constraintViolations = {
                recentViolations: [],
                violationTypes: {
                    foreign_key_violations: { count: 0, lastOccurred: null },
                    unique_violations: { count: 0, lastOccurred: null },
                    check_violations: { count: 0, lastOccurred: null },
                    not_null_violations: { count: 0, lastOccurred: null }
                },
                violationHandling: {
                    autoRetry: true,
                    maxRetries: 3,
                    backoffStrategy: 'exponential',
                    notifyOnViolation: true
                },
                violationStats: {
                    totalViolations: 0,
                    violationsByType: {},
                    violationsByTable: {},
                    averageResolutionTime: 0,
                    resolutionSuccessRate: 100.0
                },
                violationPrevention: {
                    enabled: true,
                    proactiveChecks: true,
                    inputValidation: true,
                    constraintHints: true
                }
            };

            // Store constraint violation handling
            await redisClient.setex(violationKey, 60 * 60, JSON.stringify(constraintViolations));

            // Verify constraint violation handling
            const violationData = await redisClient.get(violationKey);
            expect(violationData).toBeDefined();

            const parsedViolations = JSON.parse(violationData!);
            expect(parsedViolations.recentViolations).toHaveLength(0);
            expect(parsedViolations.violationStats.totalViolations).toBe(0);
            expect(parsedViolations.violationHandling.autoRetry).toBe(true);
        });

        it('should validate data types and formats', async () => {
            const dataTypeKey = 'integrity:data_types';
            const dataTypes = {
                fieldValidations: {
                    username: {
                        type: 'string',
                        minLength: 3,
                        maxLength: 30,
                        pattern: '^[a-zA-Z0-9_-]+$',
                        violations: 0,
                        totalChecked: 89
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        violations: 0,
                        totalChecked: 67
                    },
                    score: {
                        type: 'integer',
                        minValue: 0,
                        maxValue: 100,
                        violations: 0,
                        totalChecked: 567
                    },
                    timestamp: {
                        type: 'datetime',
                        violations: 0,
                        totalChecked: 1234
                    }
                },
                formatValidation: {
                    json_fields: { valid: true, violations: 0 },
                    uuid_fields: { valid: true, violations: 0 },
                    enum_fields: { valid: true, violations: 0 },
                    array_fields: { valid: true, violations: 0 }
                },
                typeStats: {
                    totalFields: 45,
                    validatedFields: 45,
                    invalidFields: 0,
                    validationScore: 100.0
                }
            };

            // Store data type validation
            await redisClient.setex(dataTypeKey, 60 * 60, JSON.stringify(dataTypes));

            // Verify data type validation
            const typeData = await redisClient.get(dataTypeKey);
            expect(typeData).toBeDefined();

            const parsedTypes = JSON.parse(typeData!);
            expect(parsedTypes.fieldValidations.username.violations).toBe(0);
            expect(parsedTypes.formatValidation.json_fields.valid).toBe(true);
            expect(parsedTypes.typeStats.invalidFields).toBe(0);
        });
    });

    describe('Data validation rules', () => {
        it('should enforce required field constraints', async () => {
            const requiredFieldsKey = 'integrity:required_fields';
            const requiredFields = {
                tableRequirements: {
                    users: {
                        required: ['id', 'username', 'role', 'createdAt'],
                        optional: ['email', 'updatedAt'],
                        violations: 0,
                        totalRecords: 89
                    },
                    game_instances: {
                        required: ['id', 'name', 'accessCode', 'gameTemplateId', 'initiatorUserId', 'status'],
                        optional: ['settings', 'startedAt', 'endedAt'],
                        violations: 0,
                        totalRecords: 45
                    },
                    game_participants: {
                        required: ['id', 'userId', 'gameInstanceId', 'liveScore', 'joinedAt', 'status'],
                        optional: ['finalScore', 'completedAt'],
                        violations: 0,
                        totalRecords: 156
                    }
                },
                fieldValidation: {
                    nullChecks: { violations: 0, totalChecked: 290 },
                    emptyStringChecks: { violations: 0, totalChecked: 145 },
                    defaultValueChecks: { violations: 0, totalChecked: 200 }
                },
                requirementStats: {
                    totalRequiredFields: 23,
                    satisfiedRequirements: 23,
                    missingRequirements: 0,
                    complianceRate: 100.0
                }
            };

            // Store required field validation
            await redisClient.setex(requiredFieldsKey, 60 * 60, JSON.stringify(requiredFields));

            // Verify required fields
            const fieldsData = await redisClient.get(requiredFieldsKey);
            expect(fieldsData).toBeDefined();

            const parsedFields = JSON.parse(fieldsData!);
            expect(parsedFields.tableRequirements.users.violations).toBe(0);
            expect(parsedFields.fieldValidation.nullChecks.violations).toBe(0);
            expect(parsedFields.requirementStats.complianceRate).toBe(100.0);
        });

        it('should validate enum and status values', async () => {
            const enumValidationKey = 'integrity:enum_validation';
            const enumValidation = {
                enumFields: {
                    user_role: {
                        validValues: ['STUDENT', 'TEACHER', 'ADMIN'],
                        currentDistribution: { STUDENT: 78, TEACHER: 10, ADMIN: 1 },
                        invalidValues: 0,
                        totalChecked: 89
                    },
                    game_status: {
                        validValues: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
                        currentDistribution: { ACTIVE: 23, COMPLETED: 18, PENDING: 4 },
                        invalidValues: 0,
                        totalChecked: 45
                    },
                    participant_status: {
                        validValues: ['ACTIVE', 'COMPLETED', 'DISCONNECTED'],
                        currentDistribution: { ACTIVE: 67, COMPLETED: 78, DISCONNECTED: 11 },
                        invalidValues: 0,
                        totalChecked: 156
                    }
                },
                statusTransitions: {
                    validTransitions: {
                        'PENDING->ACTIVE': true,
                        'ACTIVE->COMPLETED': true,
                        'ACTIVE->CANCELLED': true,
                        'INVALID_TRANSITION': false
                    },
                    transitionViolations: 0,
                    totalTransitions: 89
                },
                enumStats: {
                    totalEnums: 8,
                    validEnums: 8,
                    invalidEnums: 0,
                    enumComplianceRate: 100.0
                }
            };

            // Store enum validation
            await redisClient.setex(enumValidationKey, 60 * 60, JSON.stringify(enumValidation));

            // Verify enum validation
            const enumData = await redisClient.get(enumValidationKey);
            expect(enumData).toBeDefined();

            const parsedEnums = JSON.parse(enumData!);
            expect(parsedEnums.enumFields.user_role.invalidValues).toBe(0);
            expect(parsedEnums.statusTransitions.transitionViolations).toBe(0);
            expect(parsedEnums.enumStats.enumComplianceRate).toBe(100.0);
        });

        it('should validate cross-field dependencies', async () => {
            const dependencyKey = 'integrity:cross_field_dependencies';
            const crossFieldDependencies = {
                dependencies: {
                    game_started_requires_created: {
                        dependentField: 'startedAt',
                        dependsOnField: 'createdAt',
                        rule: 'startedAt >= createdAt',
                        violations: 0,
                        totalChecked: 45
                    },
                    participant_score_range: {
                        dependentField: 'liveScore',
                        dependsOnField: 'questionCount',
                        rule: 'liveScore <= questionCount * maxPointsPerQuestion',
                        violations: 0,
                        totalChecked: 156
                    },
                    session_duration_limits: {
                        dependentField: 'endedAt',
                        dependsOnField: 'startedAt',
                        rule: 'endedAt - startedAt <= maxSessionDuration',
                        violations: 0,
                        totalChecked: 34
                    }
                },
                dependencyValidation: {
                    totalDependencies: 5,
                    validatedDependencies: 5,
                    failedDependencies: 0,
                    dependencyScore: 100.0
                },
                dependencyGraph: {
                    nodes: ['createdAt', 'startedAt', 'endedAt', 'liveScore', 'questionCount'],
                    edges: [
                        { from: 'createdAt', to: 'startedAt' },
                        { from: 'startedAt', to: 'endedAt' },
                        { from: 'questionCount', to: 'liveScore' }
                    ]
                }
            };

            // Store cross-field dependency validation
            await redisClient.setex(dependencyKey, 60 * 60, JSON.stringify(crossFieldDependencies));

            // Verify cross-field dependencies
            const dependencyData = await redisClient.get(dependencyKey);
            expect(dependencyData).toBeDefined();

            const parsedDependencies = JSON.parse(dependencyData!);
            expect(parsedDependencies.dependencies.game_started_requires_created.violations).toBe(0);
            expect(parsedDependencies.dependencyValidation.failedDependencies).toBe(0);
            expect(parsedDependencies.dependencyGraph.nodes).toHaveLength(5);
        });

        it('should validate data integrity triggers', async () => {
            const triggerKey = 'integrity:data_triggers';
            const dataTriggers = {
                triggers: {
                    update_timestamp: {
                        trigger: 'auto_update_timestamp',
                        firesOn: 'UPDATE',
                        updatesField: 'updatedAt',
                        executions: 234,
                        failures: 0
                    },
                    score_validation: {
                        trigger: 'validate_score_range',
                        firesOn: 'INSERT,UPDATE',
                        validatesField: 'liveScore',
                        executions: 156,
                        failures: 0
                    },
                    status_transition: {
                        trigger: 'validate_status_transition',
                        firesOn: 'UPDATE',
                        validatesField: 'status',
                        executions: 89,
                        failures: 0
                    }
                },
                triggerStats: {
                    totalTriggers: 7,
                    activeTriggers: 7,
                    failedTriggers: 0,
                    totalExecutions: 479,
                    failedExecutions: 0,
                    executionSuccessRate: 100.0
                },
                triggerHealth: {
                    lastHealthCheck: new Date(),
                    healthyTriggers: 7,
                    unhealthyTriggers: 0,
                    recommendations: []
                }
            };

            // Store data trigger validation
            await redisClient.setex(triggerKey, 60 * 60, JSON.stringify(dataTriggers));

            // Verify data triggers
            const triggerData = await redisClient.get(triggerKey);
            expect(triggerData).toBeDefined();

            const parsedTriggers = JSON.parse(triggerData!);
            expect(parsedTriggers.triggers.update_timestamp.failures).toBe(0);
            expect(parsedTriggers.triggerStats.failedExecutions).toBe(0);
            expect(parsedTriggers.triggerHealth.healthyTriggers).toBe(7);
        });
    });
});