-- AlterTable
ALTER TABLE "CheckInForm" ADD COLUMN     "isMainForm" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CheckInSubmission" ADD COLUMN     "phoneNumber" TEXT;

-- CreateIndex
CREATE INDEX "CheckInSubmission_phoneNumber_idx" ON "CheckInSubmission"("phoneNumber");
