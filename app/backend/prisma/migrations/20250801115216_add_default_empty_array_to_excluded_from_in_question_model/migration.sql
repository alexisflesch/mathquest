/*
  Warnings:

  - You are about to drop the column `is_hidden` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "questions" DROP COLUMN "is_hidden",
ADD COLUMN     "excludedFrom" TEXT[] DEFAULT ARRAY[]::TEXT[];
