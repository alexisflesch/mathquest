/*
  Warnings:

  - You are about to drop the column `quiz_template_id` on the `game_instances` table. All the data in the column will be lost.
  - You are about to drop the `questions_in_quiz_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quiz_templates` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `game_template_id` to the `game_instances` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "game_instances" DROP CONSTRAINT "game_instances_quiz_template_id_fkey";

-- DropForeignKey
ALTER TABLE "questions_in_quiz_templates" DROP CONSTRAINT "questions_in_quiz_templates_question_uid_fkey";

-- DropForeignKey
ALTER TABLE "questions_in_quiz_templates" DROP CONSTRAINT "questions_in_quiz_templates_quiz_template_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_templates" DROP CONSTRAINT "quiz_templates_creator_teacher_id_fkey";

-- AlterTable
ALTER TABLE "game_instances" DROP COLUMN "quiz_template_id",
ADD COLUMN     "game_template_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "questions_in_quiz_templates";

-- DropTable
DROP TABLE "quiz_templates";

-- CreateTable
CREATE TABLE "game_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creator_teacher_id" TEXT NOT NULL,
    "grade_level" TEXT,
    "themes" TEXT[],
    "discipline" TEXT,
    "description" TEXT,
    "default_mode" "PlayMode",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions_in_game_templates" (
    "game_template_id" TEXT NOT NULL,
    "question_uid" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_in_game_templates_pkey" PRIMARY KEY ("game_template_id","sequence")
);

-- CreateIndex
CREATE UNIQUE INDEX "questions_in_game_templates_game_template_id_question_uid_key" ON "questions_in_game_templates"("game_template_id", "question_uid");

-- AddForeignKey
ALTER TABLE "game_templates" ADD CONSTRAINT "game_templates_creator_teacher_id_fkey" FOREIGN KEY ("creator_teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions_in_game_templates" ADD CONSTRAINT "questions_in_game_templates_game_template_id_fkey" FOREIGN KEY ("game_template_id") REFERENCES "game_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions_in_game_templates" ADD CONSTRAINT "questions_in_game_templates_question_uid_fkey" FOREIGN KEY ("question_uid") REFERENCES "questions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_instances" ADD CONSTRAINT "game_instances_game_template_id_fkey" FOREIGN KEY ("game_template_id") REFERENCES "game_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
