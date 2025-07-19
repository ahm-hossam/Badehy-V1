/*
  Warnings:

  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_trainerId_fkey";

-- DropForeignKey
ALTER TABLE "Package" DROP CONSTRAINT "Package_trainerId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_clientId_fkey";

-- DropTable
DROP TABLE "Client";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "TrainerClient" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT,
    "age" INTEGER,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainerClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainerClient_trainerId_idx" ON "TrainerClient"("trainerId");

-- AddForeignKey
ALTER TABLE "TrainerClient" ADD CONSTRAINT "TrainerClient_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
