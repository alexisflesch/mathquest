/*
  Warnings:

  - Made the column `time_limit_seconds` on table `questions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "questions" ALTER COLUMN "time_limit_seconds" SET NOT NULL;
