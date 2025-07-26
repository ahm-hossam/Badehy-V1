-- AlterTable
ALTER TABLE "TrainerClient" ADD COLUMN     "selectedFormId" INTEGER;

-- AddForeignKey
ALTER TABLE "TrainerClient" ADD CONSTRAINT "TrainerClient_selectedFormId_fkey" FOREIGN KEY ("selectedFormId") REFERENCES "CheckInForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
