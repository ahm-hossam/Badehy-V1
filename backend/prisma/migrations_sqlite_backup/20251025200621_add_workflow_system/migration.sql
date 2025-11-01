/*
  Warnings:

  - You are about to drop the `BrandingSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PDFTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PDFTemplatePage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `branding` on the `NutritionProgram` table. All the data in the column will be lost.
  - You are about to drop the column `template` on the `NutritionProgram` table. All the data in the column will be lost.
  - You are about to drop the column `branding` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `template` on the `Program` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "BrandingSettings_trainerId_idx";

-- DropIndex
DROP INDEX "BrandingSettings_trainerId_key";

-- DropIndex
DROP INDEX "PDFTemplate_trainerId_idx";

-- DropIndex
DROP INDEX "PDFTemplatePage_pageOrder_idx";

-- DropIndex
DROP INDEX "PDFTemplatePage_templateId_idx";

-- AlterTable
ALTER TABLE "Package" ADD COLUMN "followUpDays" INTEGER;
ALTER TABLE "Package" ADD COLUMN "followUpFormId" INTEGER;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BrandingSettings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PDFTemplate";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PDFTemplatePage";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Notification_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "notificationId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "deliveredAt" DATETIME,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationRecipient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PushToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PushToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "packageId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workflow_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Workflow_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workflowId" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "config" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workflowId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "currentStepId" INTEGER,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "lastStepAt" DATETIME,
    CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowExecution_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowExecution_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "WorkflowStep" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NutritionProgram" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pdfUrl" TEXT,
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "importedPdfUrl" TEXT,
    "programDuration" INTEGER,
    "durationUnit" TEXT DEFAULT 'weeks',
    "repeatCount" INTEGER DEFAULT 1,
    "targetCalories" REAL,
    "targetProtein" REAL,
    "targetCarbs" REAL,
    "targetFats" REAL,
    "proteinPercentage" REAL,
    "carbsPercentage" REAL,
    "fatsPercentage" REAL,
    "usePercentages" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionProgram_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_NutritionProgram" ("carbsPercentage", "createdAt", "description", "durationUnit", "fatsPercentage", "id", "importedPdfUrl", "isActive", "isImported", "name", "pdfUrl", "programDuration", "proteinPercentage", "repeatCount", "targetCalories", "targetCarbs", "targetFats", "targetProtein", "trainerId", "updatedAt", "usePercentages") SELECT "carbsPercentage", "createdAt", "description", "durationUnit", "fatsPercentage", "id", "importedPdfUrl", "isActive", "isImported", "name", "pdfUrl", "programDuration", "proteinPercentage", "repeatCount", "targetCalories", "targetCarbs", "targetFats", "targetProtein", "trainerId", "updatedAt", "usePercentages" FROM "NutritionProgram";
DROP TABLE "NutritionProgram";
ALTER TABLE "new_NutritionProgram" RENAME TO "NutritionProgram";
CREATE INDEX "NutritionProgram_trainerId_idx" ON "NutritionProgram"("trainerId");
CREATE TABLE "new_Program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pdfUrl" TEXT,
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "importedPdfUrl" TEXT,
    "programDuration" INTEGER,
    "durationUnit" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Program_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Program" ("createdAt", "description", "durationUnit", "id", "importedPdfUrl", "isDefault", "isImported", "name", "pdfUrl", "programDuration", "trainerId", "updatedAt") SELECT "createdAt", "description", "durationUnit", "id", "importedPdfUrl", "isDefault", "isImported", "name", "pdfUrl", "programDuration", "trainerId", "updatedAt" FROM "Program";
DROP TABLE "Program";
ALTER TABLE "new_Program" RENAME TO "Program";
CREATE INDEX "Program_trainerId_idx" ON "Program"("trainerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Notification_trainerId_idx" ON "Notification"("trainerId");

-- CreateIndex
CREATE INDEX "Notification_sentAt_idx" ON "Notification"("sentAt");

-- CreateIndex
CREATE INDEX "NotificationRecipient_notificationId_idx" ON "NotificationRecipient"("notificationId");

-- CreateIndex
CREATE INDEX "NotificationRecipient_clientId_idx" ON "NotificationRecipient"("clientId");

-- CreateIndex
CREATE INDEX "NotificationRecipient_status_idx" ON "NotificationRecipient"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_clientId_key" ON "PushToken"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");

-- CreateIndex
CREATE INDEX "PushToken_clientId_idx" ON "PushToken"("clientId");

-- CreateIndex
CREATE INDEX "PushToken_token_idx" ON "PushToken"("token");

-- CreateIndex
CREATE INDEX "Workflow_trainerId_idx" ON "Workflow"("trainerId");

-- CreateIndex
CREATE INDEX "Workflow_packageId_idx" ON "Workflow"("packageId");

-- CreateIndex
CREATE INDEX "Workflow_isActive_idx" ON "Workflow"("isActive");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowId_idx" ON "WorkflowStep"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowStep_stepOrder_idx" ON "WorkflowStep"("stepOrder");

-- CreateIndex
CREATE INDEX "WorkflowExecution_workflowId_idx" ON "WorkflowExecution"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_clientId_idx" ON "WorkflowExecution"("clientId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_status_idx" ON "WorkflowExecution"("status");
