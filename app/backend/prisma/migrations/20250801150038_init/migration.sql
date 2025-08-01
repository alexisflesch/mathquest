-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER');

-- CreateEnum
CREATE TYPE "PlayMode" AS ENUM ('quiz', 'tournament', 'practice', 'class');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'LEFT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "UserRole" NOT NULL,
    "reset_token" TEXT,
    "reset_token_expires_at" TIMESTAMP(3),
    "avatarEmoji" TEXT,

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

-- CreateTable
CREATE TABLE "questions" (
    "uid" TEXT NOT NULL,
    "title" TEXT,
    "question_text" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "themes" TEXT[],
    "difficulty" INTEGER,
    "grade_level" TEXT,
    "author" TEXT,
    "explanation" TEXT,
    "tags" TEXT[],
    "time_limit_seconds" INTEGER NOT NULL,
    "excluded_from" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "answer_options" TEXT[],
    "correct_answers" BOOLEAN[] DEFAULT ARRAY[]::BOOLEAN[],
    "feedbackWaitTime" INTEGER,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "game_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade_level" TEXT,
    "themes" TEXT[],
    "discipline" TEXT,
    "description" TEXT,
    "default_mode" "PlayMode",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "creator_id" TEXT NOT NULL,

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

-- CreateTable
CREATE TABLE "game_instances" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "access_code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "play_mode" "PlayMode" NOT NULL,
    "leaderboard" JSONB,
    "current_question_index" INTEGER,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "differed_available_from" TIMESTAMP(3),
    "differed_available_to" TIMESTAMP(3),
    "game_template_id" TEXT NOT NULL,
    "initiator_user_id" TEXT,

    CONSTRAINT "game_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_participants" (
    "id" TEXT NOT NULL,
    "game_instance_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "live_score" INTEGER NOT NULL DEFAULT 0,
    "deferred_score" INTEGER NOT NULL DEFAULT 0,
    "nb_attempts" INTEGER NOT NULL DEFAULT 0,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'PENDING',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "game_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_cookie_id_key" ON "StudentProfile"("cookie_id");

-- CreateIndex
CREATE UNIQUE INDEX "questions_in_game_templates_game_template_id_question_uid_key" ON "questions_in_game_templates"("game_template_id", "question_uid");

-- CreateIndex
CREATE UNIQUE INDEX "game_instances_access_code_key" ON "game_instances"("access_code");

-- CreateIndex
CREATE INDEX "game_instances_access_code_idx" ON "game_instances"("access_code");

-- CreateIndex
CREATE UNIQUE INDEX "game_participants_game_instance_id_user_id_key" ON "game_participants"("game_instance_id", "user_id");

-- AddForeignKey
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_templates" ADD CONSTRAINT "game_templates_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions_in_game_templates" ADD CONSTRAINT "questions_in_game_templates_game_template_id_fkey" FOREIGN KEY ("game_template_id") REFERENCES "game_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions_in_game_templates" ADD CONSTRAINT "questions_in_game_templates_question_uid_fkey" FOREIGN KEY ("question_uid") REFERENCES "questions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_instances" ADD CONSTRAINT "game_instances_game_template_id_fkey" FOREIGN KEY ("game_template_id") REFERENCES "game_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_instances" ADD CONSTRAINT "game_instances_initiator_user_id_fkey" FOREIGN KEY ("initiator_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_game_instance_id_fkey" FOREIGN KEY ("game_instance_id") REFERENCES "game_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
