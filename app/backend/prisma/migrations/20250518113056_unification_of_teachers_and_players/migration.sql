/*
  Warnings:

  - You are about to drop the column `initiator_student_id` on the `game_instances` table. All the data in the column will be lost.
  - You are about to drop the column `initiator_teacher_id` on the `game_instances` table. All the data in the column will be lost.
  - You are about to drop the column `creator_teacher_id` on the `game_templates` table. All the data in the column will be lost.
  - You are about to drop the `players` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teachers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `creator_id` to the `game_templates` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER');

-- DropForeignKey
ALTER TABLE "game_instances" DROP CONSTRAINT "game_instances_initiator_student_id_fkey";

-- DropForeignKey
ALTER TABLE "game_instances" DROP CONSTRAINT "game_instances_initiator_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "game_participants" DROP CONSTRAINT "game_participants_user_id_fkey";

-- DropForeignKey
ALTER TABLE "game_templates" DROP CONSTRAINT "game_templates_creator_teacher_id_fkey";

-- AlterTable
ALTER TABLE "game_instances" DROP COLUMN "initiator_student_id",
DROP COLUMN "initiator_teacher_id",
ADD COLUMN     "initiator_user_id" TEXT;

-- AlterTable
ALTER TABLE "game_templates" DROP COLUMN "creator_teacher_id",
ADD COLUMN     "creator_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "players";

-- DropTable
DROP TABLE "teachers";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherProfile" (
    "id" TEXT NOT NULL,

    CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "cookie_id" TEXT,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_cookie_id_key" ON "StudentProfile"("cookie_id");

-- AddForeignKey
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_templates" ADD CONSTRAINT "game_templates_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_instances" ADD CONSTRAINT "game_instances_initiator_user_id_fkey" FOREIGN KEY ("initiator_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
