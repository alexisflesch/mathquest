/*
  Warnings:

  - You are about to drop the column `niveau` on the `TournoiSauvegarde` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TournoiSauvegarde" DROP COLUMN "niveau",
ADD COLUMN     "niveaux" TEXT[];
