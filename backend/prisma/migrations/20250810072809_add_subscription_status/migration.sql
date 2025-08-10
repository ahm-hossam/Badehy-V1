/*
  Warnings:

  - You are about to drop the column `assignedBy` on the `ClientTeamAssignment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[originLeadId]` on the table `TrainerClient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trainerId` to the `ClientTeamAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ClientTeamAssignment" DROP CONSTRAINT "ClientTeamAssignment_assignedBy_fkey";

-- DropIndex
DROP INDEX "public"."ClientTeamAssignment_assignedBy_idx";

-- AlterTable
ALTER TABLE "public"."ClientTeamAssignment" DROP COLUMN "assignedBy",
ADD COLUMN     "trainerId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Package" ADD COLUMN     "discountApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DOUBLE PRECISION,
ADD COLUMN     "durationUnit" TEXT NOT NULL DEFAULT 'month',
ADD COLUMN     "durationValue" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "priceAfterDisc" DOUBLE PRECISION,
ADD COLUMN     "priceBeforeDisc" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Program" ADD COLUMN     "durationUnit" TEXT,
ADD COLUMN     "importedPdfUrl" TEXT,
ADD COLUMN     "isImported" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "programDuration" INTEGER;

-- AlterTable
ALTER TABLE "public"."Registered" ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "public"."TrainerClient" ADD COLUMN     "originLeadId" INTEGER;

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceEGP" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClientService" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "serviceName" TEXT NOT NULL,
    "priceEGP" DECIMAL(10,2) NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "unassignedAt" TIMESTAMP(3),
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lead" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "source" TEXT,
    "campaign" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'New',
    "ownerId" INTEGER,
    "score" INTEGER,
    "lastContactAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "notes" TEXT,
    "convertedClientId" INTEGER,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadActivity" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "byTeamMemberId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NutritionProgram" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" TEXT,
    "branding" JSONB,
    "pdfUrl" TEXT,
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "importedPdfUrl" TEXT,
    "programDuration" INTEGER,
    "durationUnit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClientProgramAssignment" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "programId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextUpdateDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,

    CONSTRAINT "ClientProgramAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClientNutritionAssignment" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "nutritionProgramId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextUpdateDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,

    CONSTRAINT "ClientNutritionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedTo" INTEGER,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER,
    "leadId" INTEGER,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskComment" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "teamMemberId" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ManuallyDeletedTask" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "category" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "originalTaskId" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManuallyDeletedTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Service_trainerId_status_idx" ON "public"."Service"("trainerId", "status");

-- CreateIndex
CREATE INDEX "Service_trainerId_name_idx" ON "public"."Service"("trainerId", "name");

-- CreateIndex
CREATE INDEX "ClientService_trainerId_clientId_isActive_paymentStatus_idx" ON "public"."ClientService"("trainerId", "clientId", "isActive", "paymentStatus");

-- CreateIndex
CREATE INDEX "ClientService_serviceId_isActive_idx" ON "public"."ClientService"("serviceId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ClientService_clientId_serviceId_isActive_key" ON "public"."ClientService"("clientId", "serviceId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_convertedClientId_key" ON "public"."Lead"("convertedClientId");

-- CreateIndex
CREATE INDEX "Lead_trainerId_stage_isArchived_idx" ON "public"."Lead"("trainerId", "stage", "isArchived");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "public"."LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "NutritionProgram_trainerId_idx" ON "public"."NutritionProgram"("trainerId");

-- CreateIndex
CREATE INDEX "ClientProgramAssignment_trainerId_idx" ON "public"."ClientProgramAssignment"("trainerId");

-- CreateIndex
CREATE INDEX "ClientProgramAssignment_clientId_idx" ON "public"."ClientProgramAssignment"("clientId");

-- CreateIndex
CREATE INDEX "ClientProgramAssignment_programId_idx" ON "public"."ClientProgramAssignment"("programId");

-- CreateIndex
CREATE INDEX "ClientNutritionAssignment_trainerId_idx" ON "public"."ClientNutritionAssignment"("trainerId");

-- CreateIndex
CREATE INDEX "ClientNutritionAssignment_clientId_idx" ON "public"."ClientNutritionAssignment"("clientId");

-- CreateIndex
CREATE INDEX "ClientNutritionAssignment_nutritionProgramId_idx" ON "public"."ClientNutritionAssignment"("nutritionProgramId");

-- CreateIndex
CREATE INDEX "Task_trainerId_idx" ON "public"."Task"("trainerId");

-- CreateIndex
CREATE INDEX "Task_assignedTo_idx" ON "public"."Task"("assignedTo");

-- CreateIndex
CREATE INDEX "Task_clientId_idx" ON "public"."Task"("clientId");

-- CreateIndex
CREATE INDEX "Task_leadId_idx" ON "public"."Task"("leadId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "public"."Task"("status");

-- CreateIndex
CREATE INDEX "Task_taskType_idx" ON "public"."Task"("taskType");

-- CreateIndex
CREATE INDEX "Task_category_idx" ON "public"."Task"("category");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_idx" ON "public"."TaskComment"("taskId");

-- CreateIndex
CREATE INDEX "TaskComment_teamMemberId_idx" ON "public"."TaskComment"("teamMemberId");

-- CreateIndex
CREATE INDEX "ManuallyDeletedTask_trainerId_idx" ON "public"."ManuallyDeletedTask"("trainerId");

-- CreateIndex
CREATE INDEX "ManuallyDeletedTask_clientId_idx" ON "public"."ManuallyDeletedTask"("clientId");

-- CreateIndex
CREATE INDEX "ManuallyDeletedTask_trainerId_clientId_category_taskType_idx" ON "public"."ManuallyDeletedTask"("trainerId", "clientId", "category", "taskType");

-- CreateIndex
CREATE INDEX "ClientTeamAssignment_trainerId_idx" ON "public"."ClientTeamAssignment"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerClient_originLeadId_key" ON "public"."TrainerClient"("originLeadId");

-- AddForeignKey
ALTER TABLE "public"."TrainerClient" ADD CONSTRAINT "TrainerClient_originLeadId_fkey" FOREIGN KEY ("originLeadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientService" ADD CONSTRAINT "ClientService_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientService" ADD CONSTRAINT "ClientService_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."TrainerClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientService" ADD CONSTRAINT "ClientService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadActivity" ADD CONSTRAINT "LeadActivity_byTeamMemberId_fkey" FOREIGN KEY ("byTeamMemberId") REFERENCES "public"."TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NutritionProgram" ADD CONSTRAINT "NutritionProgram_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientTeamAssignment" ADD CONSTRAINT "ClientTeamAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."Registered"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientProgramAssignment" ADD CONSTRAINT "ClientProgramAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."Registered"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientProgramAssignment" ADD CONSTRAINT "ClientProgramAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientProgramAssignment" ADD CONSTRAINT "ClientProgramAssignment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientNutritionAssignment" ADD CONSTRAINT "ClientNutritionAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."Registered"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientNutritionAssignment" ADD CONSTRAINT "ClientNutritionAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClientNutritionAssignment" ADD CONSTRAINT "ClientNutritionAssignment_nutritionProgramId_fkey" FOREIGN KEY ("nutritionProgramId") REFERENCES "public"."NutritionProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."Registered"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "public"."TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."TrainerClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskComment" ADD CONSTRAINT "TaskComment_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "public"."TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
