"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswerSubmissionPayloadSchema = void 0;
const zod_1 = require("zod");
exports.AnswerSubmissionPayloadSchema = zod_1.z.object({
    accessCode: zod_1.z.string(),
    userId: zod_1.z.string(),
    questionUid: zod_1.z.string(),
    answer: zod_1.z.union([
        zod_1.z.number(),
        zod_1.z.string(),
        zod_1.z.boolean(),
        zod_1.z.array(zod_1.z.number()),
        zod_1.z.array(zod_1.z.string()),
        zod_1.z.null(),
        zod_1.z.undefined()
    ]),
    timeSpent: zod_1.z.number()
});
