/*
  Warnings:

  - The values [class] on the enum `PlayMode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlayMode_new" AS ENUM ('quiz', 'tournament', 'practice');
ALTER TABLE "quiz_templates" ALTER COLUMN "default_mode" TYPE "PlayMode_new" USING ("default_mode"::text::"PlayMode_new");
ALTER TABLE "game_instances" ALTER COLUMN "play_mode" TYPE "PlayMode_new" USING ("play_mode"::text::"PlayMode_new");
ALTER TYPE "PlayMode" RENAME TO "PlayMode_old";
ALTER TYPE "PlayMode_new" RENAME TO "PlayMode";
DROP TYPE "PlayMode_old";
COMMIT;
