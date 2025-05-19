-- AlterTable
ALTER TABLE "game_instances" ADD COLUMN     "differed_available_from" TIMESTAMP(3),
ADD COLUMN     "differed_available_to" TIMESTAMP(3),
ADD COLUMN     "is_differed" BOOLEAN NOT NULL DEFAULT false;
