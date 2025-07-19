/*
  Warnings:

  - You are about to drop the column `subscriptionId` on the `TransactionImage` table. All the data in the column will be lost.
  - Added the required column `installmentId` to the `TransactionImage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TransactionImage" DROP CONSTRAINT "TransactionImage_subscriptionId_fkey";

-- DropIndex
DROP INDEX "TransactionImage_subscriptionId_idx";

-- AlterTable
ALTER TABLE "TransactionImage" DROP COLUMN "subscriptionId",
ADD COLUMN     "installmentId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "TransactionImage_installmentId_idx" ON "TransactionImage"("installmentId");

-- AddForeignKey
ALTER TABLE "TransactionImage" ADD CONSTRAINT "TransactionImage_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
