# MathQuest Backend Database Integration

This document describes the database integration and schema for the MathQuest backend.

## ORM: Prisma
- Uses Prisma as the ORM for PostgreSQL.
- Prisma client is instantiated as a singleton in `backend/src/db/prisma.ts` to avoid multiple connections in development.
- Prisma schema is defined in `backend/prisma/schema.prisma`.

## Main Models

### User
- Stores user accounts (students, teachers), profile info, and authentication data.
- Related to `StudentProfile`, `TeacherProfile`, `GameInstance`, `GameTemplate`, and `GameParticipant`.

### StudentProfile / TeacherProfile
- Additional profile data for students and teachers, linked to `User`.

### Question
- Stores quiz/tournament questions, answer options, correct answers, metadata, and tags.
- Linked to `QuestionsInGameTemplate` for template assignment.

### GameTemplate
- Defines a reusable set of questions for a quiz or tournament.
- Linked to `User` (creator) and `QuestionsInGameTemplate`.

### QuestionsInGameTemplate
- Join table linking questions to templates, with sequence/order.

### GameInstance
- Represents a live or historical game session.
- Tracks status, play mode, leaderboard, current question, settings, and participants.
- Linked to `GameTemplate`, `User` (initiator), and `GameParticipant`.

### GameParticipant
- Tracks a user's participation in a game, including score, answers, and timing.
- Linked to `User` and `GameInstance`.

### Enums
- `UserRole`: STUDENT, TEACHER
- `PlayMode`: quiz, tournament, practice, class

## Best Practices
- All relations are explicit and use foreign keys.
- Use Prisma migrations to evolve the schema.
- Sensitive data (e.g., JWT secret, database URL) is managed via environment variables.

### Handling Nullable Fields in Shared Types

When working with Prisma models that have nullable fields (marked with `?` in the schema), ensure that shared TypeScript types match Prisma's type system:

**Problem**: Prisma returns `null` for nullable fields, but TypeScript prefers `undefined` for optional properties.

**Solution**: In shared types, use `| null` for fields that are nullable in Prisma:

```typescript
// ❌ Incorrect - causes type errors
export interface GameInstance {
    currentQuestionIndex?: number;  // TypeScript expects undefined
    startedAt?: Date;              // TypeScript expects undefined
}

// ✅ Correct - matches Prisma's nullable fields
export interface GameInstance {
    currentQuestionIndex?: number | null;  // Matches Prisma Int?
    startedAt?: Date | null;              // Matches Prisma DateTime?
    endedAt?: Date | null;                // Matches Prisma DateTime?
    initiatorUserId?: string | null;      // Matches Prisma String?
}
```

**Key Fields That Are Nullable in Prisma**:
- `GameInstance.currentQuestionIndex` (Int?)
- `GameInstance.startedAt` (DateTime?)
- `GameInstance.endedAt` (DateTime?)
- `GameInstance.differedAvailableFrom` (DateTime?)
- `GameInstance.differedAvailableTo` (DateTime?)
- `GameInstance.initiatorUserId` (String?)
- `GameTemplate.gradeLevel` (String?)
- `GameTemplate.discipline` (String?)

**Database Query Considerations**: When including relations in Prisma queries, ensure all required fields are selected to match the shared type interfaces. Use `select` or `include` strategically to avoid partial object type mismatches.

---

For full schema details, see `backend/prisma/schema.prisma`.
