/*
  Warnings:

  - You are about to drop the `TournoiSauvegarde` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TournoiSauvegarde" DROP CONSTRAINT "TournoiSauvegarde_enseignant_id_fkey";

-- DropTable
DROP TABLE "TournoiSauvegarde";

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_sauvegarde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enseignant_id" TEXT NOT NULL,
    "questions_ids" TEXT[],
    "type" TEXT NOT NULL,
    "niveaux" TEXT[],
    "categories" TEXT[],
    "themes" TEXT[],

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "Enseignant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
