/*
  Warnings:

  - A unique constraint covering the columns `[tournament_code]` on the table `Quiz` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "tournament_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_tournament_code_key" ON "Quiz"("tournament_code");
