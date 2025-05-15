-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "hidden" BOOLEAN,
ADD COLUMN     "titre" TEXT,
ALTER COLUMN "difficulte" DROP NOT NULL,
ALTER COLUMN "niveau" DROP NOT NULL;
