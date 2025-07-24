-- DropForeignKey
ALTER TABLE "CheckInSubmission" DROP CONSTRAINT "CheckInSubmission_clientId_fkey";

-- AlterTable
ALTER TABLE "CheckInSubmission" ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CheckInSubmission" ADD CONSTRAINT "CheckInSubmission_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
