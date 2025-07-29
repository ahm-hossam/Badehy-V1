-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "holdDuration" INTEGER,
ADD COLUMN     "holdDurationUnit" TEXT,
ADD COLUMN     "holdEndDate" TIMESTAMP(3),
ADD COLUMN     "holdStartDate" TIMESTAMP(3),
ADD COLUMN     "isOnHold" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SubscriptionHold" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "holdStartDate" TIMESTAMP(3) NOT NULL,
    "holdEndDate" TIMESTAMP(3) NOT NULL,
    "holdDuration" INTEGER NOT NULL,
    "holdDurationUnit" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionHold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionHold_subscriptionId_idx" ON "SubscriptionHold"("subscriptionId");

-- AddForeignKey
ALTER TABLE "SubscriptionHold" ADD CONSTRAINT "SubscriptionHold_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
