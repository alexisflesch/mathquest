-- CreateEnum
CREATE TYPE "ParticipationType" AS ENUM ('LIVE', 'DEFERRED');

-- AlterTable
ALTER TABLE "game_participants" ADD COLUMN     "participation_type" "ParticipationType" NOT NULL DEFAULT 'LIVE';
