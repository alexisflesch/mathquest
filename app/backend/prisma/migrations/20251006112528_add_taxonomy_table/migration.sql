-- CreateTable
CREATE TABLE "taxonomy" (
    "id" TEXT NOT NULL,
    "grade_level" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "content_hash" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "taxonomy_grade_level_key" ON "taxonomy"("grade_level");
