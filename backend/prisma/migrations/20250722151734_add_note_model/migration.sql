/*
  Warnings:

  - You are about to drop the column `notes` on the `TrainerClient` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TrainerClient" DROP COLUMN "notes";

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_clientId_idx" ON "Note"("clientId");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
