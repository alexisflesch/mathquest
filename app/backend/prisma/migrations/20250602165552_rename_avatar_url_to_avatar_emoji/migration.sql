/*
  Warnings:

  - You are about to drop the column `avatarEmoji` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarEmoji",
ADD COLUMN     "avatarEmoji" TEXT;
