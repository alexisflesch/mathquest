/*
  Warnings:

  - You are about to drop the column `player_id` on the `game_participants` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[game_instance_id,user_id]` on the table `game_participants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `game_participants` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "game_participants" DROP CONSTRAINT "game_participants_player_id_fkey";

-- DropIndex
DROP INDEX "game_participants_game_instance_id_player_id_key";

-- AlterTable
ALTER TABLE "game_participants" DROP COLUMN "player_id",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "game_participants_game_instance_id_user_id_key" ON "game_participants"("game_instance_id", "user_id");

-- AddForeignKey
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
