/*
  Warnings:

  - Added the required column `clientId` to the `CheckInSubmission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CheckInSubmission" ADD COLUMN     "clientId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "CheckInSubmission_clientId_idx" ON "CheckInSubmission"("clientId");

-- AddForeignKey
ALTER TABLE "CheckInSubmission" ADD CONSTRAINT "CheckInSubmission_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
