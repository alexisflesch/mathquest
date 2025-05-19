-- AlterTable
ALTER TABLE "game_instances" ADD COLUMN     "initiator_student_id" TEXT;

-- AddForeignKey
ALTER TABLE "game_instances" ADD CONSTRAINT "game_instances_initiator_student_id_fkey" FOREIGN KEY ("initiator_student_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
