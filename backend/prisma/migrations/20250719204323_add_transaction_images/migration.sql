-- CreateTable
CREATE TABLE "TransactionImage" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "imageData" BYTEA NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionImage_subscriptionId_idx" ON "TransactionImage"("subscriptionId");

-- AddForeignKey
ALTER TABLE "TransactionImage" ADD CONSTRAINT "TransactionImage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
