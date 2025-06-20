/*
  Warnings:

  - You are about to drop the column `answers` on the `game_participants` table. All the data in the column will be lost.
  - You are about to drop the column `completed_at` on the `game_participants` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `game_participants` table. All the data in the column will be lost.
  - You are about to drop the column `rank` on the `game_participants` table. All the data in the column will be lost.
  - You are about to drop the column `time_taken_ms` on the `game_participants` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `game_participants` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "game_participants_game_instance_id_user_id_key";

-- AlterTable
ALTER TABLE "game_participants" DROP COLUMN "answers",
DROP COLUMN "completed_at",
DROP COLUMN "created_at",
DROP COLUMN "rank",
DROP COLUMN "time_taken_ms",
DROP COLUMN "updated_at",
ADD COLUMN     "attempt_count" INTEGER NOT NULL DEFAULT 1;
