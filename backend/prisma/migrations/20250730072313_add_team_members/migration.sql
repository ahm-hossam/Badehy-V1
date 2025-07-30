/*
  Warnings:

  - You are about to drop the column `email` on the `SupportRequest` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `SupportRequest` table. All the data in the column will be lost.
  - Added the required column `trainerId` to the `SupportRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SupportRequest" DROP COLUMN "email",
DROP COLUMN "name",
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "trainerId" INTEGER NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientTeamAssignment" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "teamMemberId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" INTEGER NOT NULL,

    CONSTRAINT "ClientTeamAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_email_key" ON "TeamMember"("email");

-- CreateIndex
CREATE INDEX "TeamMember_trainerId_idx" ON "TeamMember"("trainerId");

-- CreateIndex
CREATE INDEX "ClientTeamAssignment_clientId_idx" ON "ClientTeamAssignment"("clientId");

-- CreateIndex
CREATE INDEX "ClientTeamAssignment_teamMemberId_idx" ON "ClientTeamAssignment"("teamMemberId");

-- CreateIndex
CREATE INDEX "ClientTeamAssignment_assignedBy_idx" ON "ClientTeamAssignment"("assignedBy");

-- CreateIndex
CREATE UNIQUE INDEX "ClientTeamAssignment_clientId_teamMemberId_key" ON "ClientTeamAssignment"("clientId", "teamMemberId");

-- CreateIndex
CREATE INDEX "SupportRequest_trainerId_idx" ON "SupportRequest"("trainerId");

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTeamAssignment" ADD CONSTRAINT "ClientTeamAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTeamAssignment" ADD CONSTRAINT "ClientTeamAssignment_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTeamAssignment" ADD CONSTRAINT "ClientTeamAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
