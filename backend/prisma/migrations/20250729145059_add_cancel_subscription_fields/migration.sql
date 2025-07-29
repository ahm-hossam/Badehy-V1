-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "isCanceled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refundAmount" DECIMAL(10,2),
ADD COLUMN     "refundType" TEXT;
