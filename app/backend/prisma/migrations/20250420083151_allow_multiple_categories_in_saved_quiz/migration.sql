/*
  Warnings:

  - You are about to drop the column `categorie` on the `TournoiSauvegarde` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TournoiSauvegarde" DROP COLUMN "categorie",
ADD COLUMN     "categories" TEXT[];
