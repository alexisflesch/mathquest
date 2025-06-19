/*
  Warnings:

  - You are about to drop the column `is_deferred` on the `game_participants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "game_instances" ADD COLUMN     "is_differed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "game_participants" DROP COLUMN "is_deferred";
