-- AlterTable
ALTER TABLE "Enseignant" ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expires" TIMESTAMP(3);
