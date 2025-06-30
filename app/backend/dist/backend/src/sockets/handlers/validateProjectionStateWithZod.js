"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectionStatePayloadSchema = void 0;
exports.validateProjectionStatePayload = validateProjectionStatePayload;
const zod_1 = require("zod");
const socketEvents_zod_1 = require("../../../../shared/types/socketEvents.zod");
// Minimal schema for projection_state payload
exports.projectionStatePayloadSchema = zod_1.z.object({
    gameState: zod_1.z.object({
        questionData: socketEvents_zod_1.questionDataSchema,
        // ... you can add more fields as needed for stricter validation
    }).passthrough(),
    answersLocked: zod_1.z.boolean().optional(),
});
function validateProjectionStatePayload(payload) {
    return exports.projectionStatePayloadSchema.safeParse(payload);
}
