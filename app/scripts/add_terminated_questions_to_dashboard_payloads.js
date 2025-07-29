// Modernization script: add terminatedQuestions to dashboard and correct_answers payloads
// Usage: node scripts/add_terminated_questions_to_dashboard_payloads.js

const fs = require('fs');
const path = require('path');

const dashboardPayloadsPath = path.resolve(__dirname, '../shared/types/socket/dashboardPayloads.ts');
const payloadsPath = path.resolve(__dirname, '../shared/types/socket/payloads.ts');
const zodPath = path.resolve(__dirname, '../shared/types/socketEvents.zod.ts');

function patchDashboardPayloads() {
    let code = fs.readFileSync(dashboardPayloadsPath, 'utf8');
    // Patch DashboardJoinedPayload
    code = code.replace(
        /(export interface DashboardJoinedPayload \{[\s\S]*?success: boolean;)/,
        `$1\n  /** Map of questionUid to terminated status */\n  terminatedQuestions?: Record<string, boolean>;`
    );
    // Patch ShowCorrectAnswersPayload
    code = code.replace(
        /(export interface ShowCorrectAnswersPayload \{[\s\S]*?teacherId\?: string;)/,
        `$1\n  /** Map of questionUid to terminated status */\n  terminatedQuestions?: Record<string, boolean>;`
    );
    fs.writeFileSync(dashboardPayloadsPath, code);
}

function patchZodSchemas() {
    let zod = fs.readFileSync(zodPath, 'utf8');
    // Patch correctAnswersPayloadSchema
    zod = zod.replace(
        /(export const correctAnswersPayloadSchema = z.object\({[\s\S]*?\})\);)/,
        `$1\n  .extend({\n    terminatedQuestions: z.record(z.boolean()).optional()\n  })`
    );
    fs.writeFileSync(zodPath, zod);
}

patchDashboardPayloads();
patchZodSchemas();

console.log('Patched dashboard payloads and Zod schemas for terminatedQuestions.');
