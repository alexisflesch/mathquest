/*
  Warnings:

  - You are about to drop the column `excludedFrom` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "questions" DROP COLUMN "excludedFrom",
ADD COLUMN     "excluded_from" TEXT[] DEFAULT ARRAY[]::TEXT[];
