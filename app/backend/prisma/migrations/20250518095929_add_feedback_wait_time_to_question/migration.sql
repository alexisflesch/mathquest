-- AlterEnum
ALTER TYPE "PlayMode" ADD VALUE 'class';

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "feedbackWaitTime" INTEGER;
