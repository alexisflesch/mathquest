/*
  Warnings:

  - You are about to drop the column `cree_par_id` on the `Tournoi` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tournoi" DROP CONSTRAINT "Tournoi_cree_par_id_fkey";

-- AlterTable
ALTER TABLE "Tournoi" DROP COLUMN "cree_par_id",
ADD COLUMN     "cree_par_enseignant_id" TEXT,
ADD COLUMN     "cree_par_joueur_id" TEXT;

-- AddForeignKey
ALTER TABLE "Tournoi" ADD CONSTRAINT "Tournoi_cree_par_joueur_id_fkey" FOREIGN KEY ("cree_par_joueur_id") REFERENCES "Joueur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournoi" ADD CONSTRAINT "Tournoi_cree_par_enseignant_id_fkey" FOREIGN KEY ("cree_par_enseignant_id") REFERENCES "Enseignant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
