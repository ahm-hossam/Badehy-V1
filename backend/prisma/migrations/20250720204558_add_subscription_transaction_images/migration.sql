-- CreateTable
CREATE TABLE "SubscriptionTransactionImage" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "imageData" BYTEA NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionId" INTEGER NOT NULL,

    CONSTRAINT "SubscriptionTransactionImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionTransactionImage_subscriptionId_idx" ON "SubscriptionTransactionImage"("subscriptionId");

-- AddForeignKey
ALTER TABLE "SubscriptionTransactionImage" ADD CONSTRAINT "SubscriptionTransactionImage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
