/*
  Warnings:

  - You are about to drop the column `is_differed` on the `game_instances` table. All the data in the column will be lost.
  - You are about to drop the column `attempt_count` on the `game_participants` table. All the data in the column will be lost.
  - You are about to drop the column `participation_type` on the `game_participants` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `game_participants` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[game_instance_id,user_id]` on the table `game_participants` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'LEFT');

-- AlterTable
ALTER TABLE "game_instances" DROP COLUMN "is_differed";

-- AlterTable
ALTER TABLE "game_participants" DROP COLUMN "attempt_count",
DROP COLUMN "participation_type",
DROP COLUMN "score",
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "deferred_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_active_at" TIMESTAMP(3),
ADD COLUMN     "live_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nb_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "ParticipantStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "ParticipationType";

-- CreateIndex
CREATE UNIQUE INDEX "game_participants_game_instance_id_user_id_key" ON "game_participants"("game_instance_id", "user_id");
