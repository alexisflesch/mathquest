-- CreateEnum
CREATE TYPE "PlayMode" AS ENUM ('quiz', 'tournament', 'practice');

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar_url" TEXT,
    "reset_token" TEXT,
    "reset_token_expires_at" TIMESTAMP(3),

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "cookie_id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar_url" TEXT,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "uid" TEXT NOT NULL,
    "title" TEXT,
    "question_text" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "question_type" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "themes" TEXT[],
    "difficulty" INTEGER,
    "grade_level" TEXT,
    "author" TEXT,
    "explanation" TEXT,
    "tags" TEXT[],
    "time_limit_seconds" INTEGER,
    "is_hidden" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "quiz_templates" (
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

    CONSTRAINT "quiz_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions_in_quiz_templates" (
    "quiz_template_id" TEXT NOT NULL,
    "question_uid" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_in_quiz_templates_pkey" PRIMARY KEY ("quiz_template_id","sequence")
);

-- CreateTable
CREATE TABLE "game_instances" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quiz_template_id" TEXT NOT NULL,
    "initiator_teacher_id" TEXT,
    "access_code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "play_mode" "PlayMode" NOT NULL,
    "leaderboard" JSONB,
    "current_question_index" INTEGER,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "game_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_participants" (
    "id" TEXT NOT NULL,
    "game_instance_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "time_taken_ms" INTEGER,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "answers" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teachers_username_key" ON "teachers"("username");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_email_key" ON "teachers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "players_username_key" ON "players"("username");

-- CreateIndex
CREATE UNIQUE INDEX "players_cookie_id_key" ON "players"("cookie_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_email_key" ON "players"("email");

-- CreateIndex
CREATE UNIQUE INDEX "questions_in_quiz_templates_quiz_template_id_question_uid_key" ON "questions_in_quiz_templates"("quiz_template_id", "question_uid");

-- CreateIndex
CREATE UNIQUE INDEX "game_instances_access_code_key" ON "game_instances"("access_code");

-- CreateIndex
CREATE INDEX "game_instances_access_code_idx" ON "game_instances"("access_code");

-- CreateIndex
CREATE UNIQUE INDEX "game_participants_game_instance_id_player_id_key" ON "game_participants"("game_instance_id", "player_id");

-- AddForeignKey
ALTER TABLE "quiz_templates" ADD CONSTRAINT "quiz_templates_creator_teacher_id_fkey" FOREIGN KEY ("creator_teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions_in_quiz_templates" ADD CONSTRAINT "questions_in_quiz_templates_quiz_template_id_fkey" FOREIGN KEY ("quiz_template_id") REFERENCES "quiz_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions_in_quiz_templates" ADD CONSTRAINT "questions_in_quiz_templates_question_uid_fkey" FOREIGN KEY ("question_uid") REFERENCES "questions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_instances" ADD CONSTRAINT "game_instances_quiz_template_id_fkey" FOREIGN KEY ("quiz_template_id") REFERENCES "quiz_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_instances" ADD CONSTRAINT "game_instances_initiator_teacher_id_fkey" FOREIGN KEY ("initiator_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_game_instance_id_fkey" FOREIGN KEY ("game_instance_id") REFERENCES "game_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_participants" ADD CONSTRAINT "game_participants_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
