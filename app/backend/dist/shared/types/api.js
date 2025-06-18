"use strict";
/**
 * API Types - Main export file
 * Re-exports all API-related types and schemas
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionsCountResponseSchema = exports.TournamentCodeResponseSchema = exports.GameTemplateCreationResponseSchema = exports.QuestionsFiltersResponseSchema = exports.QuizCreationResponseSchema = exports.QuizListResponseSchema = exports.GameCreationResponseSchema = exports.QuestionsResponseSchema = exports.UpdateQuestionRequestSchema = exports.CreateQuestionRequestSchema = exports.UpdateGameTemplateRequestSchema = exports.CreateGameTemplateRequestSchema = exports.GameStatusUpdateRequestSchema = exports.GameJoinRequestSchema = exports.CreateGameRequestSchema = exports.RegisterRequestSchema = exports.LoginRequestSchema = exports.ApiResponses = exports.ApiRequests = exports.ApiSchemas = void 0;
// Import modules to avoid naming conflicts
const ApiSchemas = __importStar(require("./api/schemas"));
exports.ApiSchemas = ApiSchemas;
const ApiRequests = __importStar(require("./api/requests"));
exports.ApiRequests = ApiRequests;
const ApiResponses = __importStar(require("./api/responses"));
exports.ApiResponses = ApiResponses;
// Re-export specific commonly used schemas directly
var schemas_1 = require("./api/schemas");
Object.defineProperty(exports, "LoginRequestSchema", { enumerable: true, get: function () { return schemas_1.LoginRequestSchema; } });
Object.defineProperty(exports, "RegisterRequestSchema", { enumerable: true, get: function () { return schemas_1.RegisterRequestSchema; } });
Object.defineProperty(exports, "CreateGameRequestSchema", { enumerable: true, get: function () { return schemas_1.CreateGameRequestSchema; } });
Object.defineProperty(exports, "GameJoinRequestSchema", { enumerable: true, get: function () { return schemas_1.GameJoinRequestSchema; } });
Object.defineProperty(exports, "GameStatusUpdateRequestSchema", { enumerable: true, get: function () { return schemas_1.GameStatusUpdateRequestSchema; } });
Object.defineProperty(exports, "CreateGameTemplateRequestSchema", { enumerable: true, get: function () { return schemas_1.CreateGameTemplateRequestSchema; } });
Object.defineProperty(exports, "UpdateGameTemplateRequestSchema", { enumerable: true, get: function () { return schemas_1.UpdateGameTemplateRequestSchema; } });
Object.defineProperty(exports, "CreateQuestionRequestSchema", { enumerable: true, get: function () { return schemas_1.CreateQuestionRequestSchema; } });
Object.defineProperty(exports, "UpdateQuestionRequestSchema", { enumerable: true, get: function () { return schemas_1.UpdateQuestionRequestSchema; } });
Object.defineProperty(exports, "QuestionsResponseSchema", { enumerable: true, get: function () { return schemas_1.QuestionsResponseSchema; } });
Object.defineProperty(exports, "GameCreationResponseSchema", { enumerable: true, get: function () { return schemas_1.GameCreationResponseSchema; } });
Object.defineProperty(exports, "QuizListResponseSchema", { enumerable: true, get: function () { return schemas_1.QuizListResponseSchema; } });
Object.defineProperty(exports, "QuizCreationResponseSchema", { enumerable: true, get: function () { return schemas_1.QuizCreationResponseSchema; } });
Object.defineProperty(exports, "QuestionsFiltersResponseSchema", { enumerable: true, get: function () { return schemas_1.QuestionsFiltersResponseSchema; } });
Object.defineProperty(exports, "GameTemplateCreationResponseSchema", { enumerable: true, get: function () { return schemas_1.GameTemplateCreationResponseSchema; } });
Object.defineProperty(exports, "TournamentCodeResponseSchema", { enumerable: true, get: function () { return schemas_1.TournamentCodeResponseSchema; } });
Object.defineProperty(exports, "QuestionsCountResponseSchema", { enumerable: true, get: function () { return schemas_1.QuestionsCountResponseSchema; } });
