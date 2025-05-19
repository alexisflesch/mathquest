/*
  Warnings:

  - You are about to drop the column `responses` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "questions" DROP COLUMN "responses",
ADD COLUMN     "answer_options" TEXT[],
ADD COLUMN     "correct_answers" BOOLEAN[] DEFAULT ARRAY[]::BOOLEAN[];
