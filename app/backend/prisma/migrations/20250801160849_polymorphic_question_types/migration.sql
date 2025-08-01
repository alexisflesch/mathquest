/*
  Warnings:

  - You are about to drop the column `answer_options` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `correct_answers` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "questions" DROP COLUMN "answer_options",
DROP COLUMN "correct_answers",
ADD COLUMN     "is_hidden" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "multiple_choice_questions" (
    "question_uid" TEXT NOT NULL,
    "answer_options" TEXT[],
    "correct_answers" BOOLEAN[],

    CONSTRAINT "multiple_choice_questions_pkey" PRIMARY KEY ("question_uid")
);

-- CreateTable
CREATE TABLE "numeric_questions" (
    "question_uid" TEXT NOT NULL,
    "correct_answer" DOUBLE PRECISION NOT NULL,
    "tolerance" DOUBLE PRECISION DEFAULT 0,
    "unit" TEXT,

    CONSTRAINT "numeric_questions_pkey" PRIMARY KEY ("question_uid")
);

-- AddForeignKey
ALTER TABLE "multiple_choice_questions" ADD CONSTRAINT "multiple_choice_questions_question_uid_fkey" FOREIGN KEY ("question_uid") REFERENCES "questions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numeric_questions" ADD CONSTRAINT "numeric_questions_question_uid_fkey" FOREIGN KEY ("question_uid") REFERENCES "questions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
