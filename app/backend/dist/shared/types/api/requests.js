"use strict";
/**
 * Shared API Request Types
 *
 * All API request types should be defined here and imported by both
 * backend and frontend to ensure contract consistency.
 *
 * Types are inferred from Zod schemas for runtime validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetQuestionRequestSchema = exports.ProfileUpdateRequestSchema = exports.PasswordResetConfirmRequestSchema = exports.PasswordResetRequestSchema = exports.UpgradeAccountRequestSchema = exports.UpdateQuizTemplateRequestSchema = exports.CreateQuizTemplateRequestSchema = exports.UpdateUserRequestSchema = exports.UpdateQuestionRequestSchema = exports.CreateQuestionRequestSchema = exports.UpdateGameTemplateRequestSchema = exports.CreateGameTemplateRequestSchema = exports.GameStatusUpdateRequestSchema = exports.GameJoinRequestSchema = exports.CreateGameRequestSchema = exports.RegisterRequestSchema = exports.LoginRequestSchema = void 0;
// Export schemas for runtime validation
var schemas_1 = require("./schemas");
Object.defineProperty(exports, "LoginRequestSchema", { enumerable: true, get: function () { return schemas_1.LoginRequestSchema; } });
Object.defineProperty(exports, "RegisterRequestSchema", { enumerable: true, get: function () { return schemas_1.RegisterRequestSchema; } });
Object.defineProperty(exports, "CreateGameRequestSchema", { enumerable: true, get: function () { return schemas_1.CreateGameRequestSchema; } });
Object.defineProperty(exports, "GameJoinRequestSchema", { enumerable: true, get: function () { return schemas_1.GameJoinRequestSchema; } });
Object.defineProperty(exports, "GameStatusUpdateRequestSchema", { enumerable: true, get: function () { return schemas_1.GameStatusUpdateRequestSchema; } });
Object.defineProperty(exports, "CreateGameTemplateRequestSchema", { enumerable: true, get: function () { return schemas_1.CreateGameTemplateRequestSchema; } });
Object.defineProperty(exports, "UpdateGameTemplateRequestSchema", { enumerable: true, get: function () { return schemas_1.UpdateGameTemplateRequestSchema; } });
Object.defineProperty(exports, "CreateQuestionRequestSchema", { enumerable: true, get: function () { return schemas_1.CreateQuestionRequestSchema; } });
Object.defineProperty(exports, "UpdateQuestionRequestSchema", { enumerable: true, get: function () { return schemas_1.UpdateQuestionRequestSchema; } });
Object.defineProperty(exports, "UpdateUserRequestSchema", { enumerable: true, get: function () { return schemas_1.UpdateUserRequestSchema; } });
Object.defineProperty(exports, "CreateQuizTemplateRequestSchema", { enumerable: true, get: function () { return schemas_1.CreateQuizTemplateRequestSchema; } });
Object.defineProperty(exports, "UpdateQuizTemplateRequestSchema", { enumerable: true, get: function () { return schemas_1.UpdateQuizTemplateRequestSchema; } });
Object.defineProperty(exports, "UpgradeAccountRequestSchema", { enumerable: true, get: function () { return schemas_1.UpgradeAccountRequestSchema; } });
Object.defineProperty(exports, "PasswordResetRequestSchema", { enumerable: true, get: function () { return schemas_1.PasswordResetRequestSchema; } });
Object.defineProperty(exports, "PasswordResetConfirmRequestSchema", { enumerable: true, get: function () { return schemas_1.PasswordResetConfirmRequestSchema; } });
Object.defineProperty(exports, "ProfileUpdateRequestSchema", { enumerable: true, get: function () { return schemas_1.ProfileUpdateRequestSchema; } });
Object.defineProperty(exports, "SetQuestionRequestSchema", { enumerable: true, get: function () { return schemas_1.SetQuestionRequestSchema; } });
// Note: SetQuestionRequest is now defined in schemas.ts with Zod validation
// No request body needed for end-question and end-game endpoints
