-- CreateTable
CREATE TABLE "Registered" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phoneNumber" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "accountStatus" TEXT NOT NULL DEFAULT 'pending',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active'
);

-- CreateTable
CREATE TABLE "TrainerClient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT,
    "age" INTEGER,
    "source" TEXT,
    "level" TEXT,
    "registrationDate" DATETIME,
    "injuriesHealthNotes" TEXT,
    "goals" TEXT,
    "goal" TEXT,
    "workoutPlace" TEXT,
    "height" INTEGER,
    "weight" INTEGER,
    "preferredTrainingDays" TEXT,
    "preferredTrainingTime" TEXT,
    "equipmentAvailability" TEXT,
    "favoriteTrainingStyle" TEXT,
    "weakAreas" TEXT,
    "nutritionGoal" TEXT,
    "dietPreference" TEXT,
    "mealCount" INTEGER,
    "foodAllergies" TEXT,
    "dislikedIngredients" TEXT,
    "currentNutritionPlan" TEXT,
    "selectedFormId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "originLeadId" INTEGER,
    CONSTRAINT "TrainerClient_originLeadId_fkey" FOREIGN KEY ("originLeadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainerClient_selectedFormId_fkey" FOREIGN KEY ("selectedFormId") REFERENCES "CheckInForm" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainerClient_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Package" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "durationValue" INTEGER NOT NULL DEFAULT 1,
    "durationUnit" TEXT NOT NULL DEFAULT 'month',
    "priceBeforeDisc" REAL NOT NULL DEFAULT 0,
    "discountApplied" BOOLEAN NOT NULL DEFAULT false,
    "discountType" TEXT,
    "discountValue" REAL,
    "priceAfterDisc" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Package_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "packageId" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "durationValue" INTEGER NOT NULL,
    "durationUnit" TEXT NOT NULL,
    "endDate" DATETIME NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "priceBeforeDisc" REAL,
    "discountApplied" BOOLEAN,
    "discountType" TEXT,
    "discountValue" REAL,
    "priceAfterDisc" REAL,
    "isOnHold" BOOLEAN NOT NULL DEFAULT false,
    "holdStartDate" DATETIME,
    "holdEndDate" DATETIME,
    "holdDuration" INTEGER,
    "holdDurationUnit" TEXT,
    "isCanceled" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" DATETIME,
    "cancelReason" TEXT,
    "refundAmount" REAL,
    "refundType" TEXT,
    "renewalHistory" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subscriptionId" INTEGER NOT NULL,
    "paidDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "remaining" REAL NOT NULL,
    "nextInstallment" DATETIME,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Installment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransactionImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "imageData" BLOB NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installmentId" INTEGER NOT NULL,
    CONSTRAINT "TransactionImage_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubscriptionTransactionImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "imageData" BLOB NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionId" INTEGER NOT NULL,
    CONSTRAINT "SubscriptionTransactionImage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubscriptionHold" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subscriptionId" INTEGER NOT NULL,
    "holdStartDate" DATETIME NOT NULL,
    "holdEndDate" DATETIME NOT NULL,
    "holdDuration" INTEGER NOT NULL,
    "holdDurationUnit" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriptionHold_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Service" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceEGP" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientService" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "serviceName" TEXT NOT NULL,
    "priceEGP" REAL NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "unassignedAt" DATETIME,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientService_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientService_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "source" TEXT,
    "campaign" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'New',
    "ownerId" INTEGER,
    "score" INTEGER,
    "lastContactAt" DATETIME,
    "nextFollowUpAt" DATETIME,
    "notes" TEXT,
    "convertedClientId" INTEGER,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "TeamMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "leadId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "byTeamMemberId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadActivity_byTeamMemberId_fkey" FOREIGN KEY ("byTeamMemberId") REFERENCES "TeamMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Label" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "trainerId" INTEGER NOT NULL,
    CONSTRAINT "Label_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Note" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Note_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckIn_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckInForm" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "isMainForm" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CheckInForm_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckInQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "formId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,
    "options" JSONB,
    "conditionGroup" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CheckInQuestion_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CheckInForm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckInSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "formId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "phoneNumber" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answers" JSONB NOT NULL,
    CONSTRAINT "CheckInSubmission_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CheckInSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CheckInForm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckInFormHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "formId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckInFormHistory_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CheckInForm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "videoUrl" TEXT,
    "description" TEXT,
    "category" TEXT,
    "bodyPart" TEXT,
    "equipment" TEXT,
    "target" TEXT,
    "secondaryMuscles" TEXT DEFAULT '[]',
    "instructions" TEXT DEFAULT '[]',
    "gifUrl" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Exercise_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" TEXT,
    "branding" JSONB,
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

-- CreateTable
CREATE TABLE "NutritionProgram" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionProgram_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgramWeek" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "programId" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProgramWeek_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgramDay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "weekId" INTEGER NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "name" TEXT,
    "dayType" TEXT NOT NULL DEFAULT 'workout',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProgramDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "ProgramWeek" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgramExercise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dayId" INTEGER NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" JSONB,
    "duration" INTEGER,
    "notes" TEXT,
    "groupId" TEXT,
    "groupType" TEXT,
    "videoUrl" TEXT,
    "dropset" BOOLEAN NOT NULL DEFAULT false,
    "singleLeg" BOOLEAN NOT NULL DEFAULT false,
    "failure" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProgramExercise_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "ProgramDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProgramExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BrandingSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "website" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BrandingSettings_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PDFTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadType" TEXT NOT NULL DEFAULT 'complete',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PDFTemplate_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PDFTemplatePage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "templateId" INTEGER NOT NULL,
    "pageName" TEXT NOT NULL,
    "pageOrder" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PDFTemplatePage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PDFTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupportRequest_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT,
    "clientId" INTEGER,
    "date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamMember_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientTeamAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "teamMemberId" INTEGER NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientTeamAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientTeamAssignment_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientTeamAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientProgramAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "programId" INTEGER NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "nextUpdateDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    CONSTRAINT "ClientProgramAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientProgramAssignment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientProgramAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientNutritionAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "nutritionProgramId" INTEGER NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "nextUpdateDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    CONSTRAINT "ClientNutritionAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientNutritionAssignment_nutritionProgramId_fkey" FOREIGN KEY ("nutritionProgramId") REFERENCES "NutritionProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientNutritionAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "assignedTo" INTEGER,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clientId" INTEGER,
    "leadId" INTEGER,
    CONSTRAINT "Task_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "TeamMember" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "teamMemberId" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskComment_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManuallyDeletedTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "category" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "originalTaskId" INTEGER NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ClientAuth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "requiresPasswordReset" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientAuth_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "dayId" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" DATETIME,
    "resumedAt" DATETIME,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalDuration" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutSession_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ClientProgramAssignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutSession_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "ProgramDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseCompletion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "setsCompleted" INTEGER NOT NULL DEFAULT 0,
    "repsCompleted" INTEGER,
    "weightUsed" REAL,
    "notes" TEXT,
    "duration" INTEGER,
    CONSTRAINT "ExerciseCompletion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExerciseCompletion_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "ProgramExercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ClientLabels" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ClientLabels_A_fkey" FOREIGN KEY ("A") REFERENCES "Label" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ClientLabels_B_fkey" FOREIGN KEY ("B") REFERENCES "TrainerClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Registered_email_key" ON "Registered"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TrainerClient_originLeadId_key" ON "TrainerClient"("originLeadId");

-- CreateIndex
CREATE INDEX "TrainerClient_trainerId_idx" ON "TrainerClient"("trainerId");

-- CreateIndex
CREATE INDEX "Package_trainerId_idx" ON "Package"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "Package_trainerId_name_key" ON "Package"("trainerId", "name");

-- CreateIndex
CREATE INDEX "Subscription_clientId_idx" ON "Subscription"("clientId");

-- CreateIndex
CREATE INDEX "Subscription_packageId_idx" ON "Subscription"("packageId");

-- CreateIndex
CREATE INDEX "Installment_subscriptionId_idx" ON "Installment"("subscriptionId");

-- CreateIndex
CREATE INDEX "TransactionImage_installmentId_idx" ON "TransactionImage"("installmentId");

-- CreateIndex
CREATE INDEX "SubscriptionTransactionImage_subscriptionId_idx" ON "SubscriptionTransactionImage"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionHold_subscriptionId_idx" ON "SubscriptionHold"("subscriptionId");

-- CreateIndex
CREATE INDEX "Service_trainerId_status_idx" ON "Service"("trainerId", "status");

-- CreateIndex
CREATE INDEX "Service_trainerId_name_idx" ON "Service"("trainerId", "name");

-- CreateIndex
CREATE INDEX "ClientService_trainerId_clientId_isActive_paymentStatus_idx" ON "ClientService"("trainerId", "clientId", "isActive", "paymentStatus");

-- CreateIndex
CREATE INDEX "ClientService_serviceId_isActive_idx" ON "ClientService"("serviceId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ClientService_clientId_serviceId_isActive_key" ON "ClientService"("clientId", "serviceId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_convertedClientId_key" ON "Lead"("convertedClientId");

-- CreateIndex
CREATE INDEX "Lead_trainerId_stage_isArchived_idx" ON "Lead"("trainerId", "stage", "isArchived");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "Label_trainerId_idx" ON "Label"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "Label_trainerId_name_key" ON "Label"("trainerId", "name");

-- CreateIndex
CREATE INDEX "Note_clientId_idx" ON "Note"("clientId");

-- CreateIndex
CREATE INDEX "CheckIn_trainerId_idx" ON "CheckIn"("trainerId");

-- CreateIndex
CREATE INDEX "CheckInQuestion_formId_idx" ON "CheckInQuestion"("formId");

-- CreateIndex
CREATE INDEX "CheckInQuestion_order_idx" ON "CheckInQuestion"("order");

-- CreateIndex
CREATE INDEX "CheckInSubmission_formId_idx" ON "CheckInSubmission"("formId");

-- CreateIndex
CREATE INDEX "CheckInSubmission_clientId_idx" ON "CheckInSubmission"("clientId");

-- CreateIndex
CREATE INDEX "CheckInSubmission_phoneNumber_idx" ON "CheckInSubmission"("phoneNumber");

-- CreateIndex
CREATE INDEX "CheckInFormHistory_formId_idx" ON "CheckInFormHistory"("formId");

-- CreateIndex
CREATE INDEX "Exercise_trainerId_idx" ON "Exercise"("trainerId");

-- CreateIndex
CREATE INDEX "Program_trainerId_idx" ON "Program"("trainerId");

-- CreateIndex
CREATE INDEX "NutritionProgram_trainerId_idx" ON "NutritionProgram"("trainerId");

-- CreateIndex
CREATE INDEX "ProgramWeek_programId_idx" ON "ProgramWeek"("programId");

-- CreateIndex
CREATE INDEX "ProgramDay_weekId_idx" ON "ProgramDay"("weekId");

-- CreateIndex
CREATE INDEX "ProgramExercise_dayId_idx" ON "ProgramExercise"("dayId");

-- CreateIndex
CREATE INDEX "ProgramExercise_exerciseId_idx" ON "ProgramExercise"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandingSettings_trainerId_key" ON "BrandingSettings"("trainerId");

-- CreateIndex
CREATE INDEX "BrandingSettings_trainerId_idx" ON "BrandingSettings"("trainerId");

-- CreateIndex
CREATE INDEX "PDFTemplate_trainerId_idx" ON "PDFTemplate"("trainerId");

-- CreateIndex
CREATE INDEX "PDFTemplatePage_templateId_idx" ON "PDFTemplatePage"("templateId");

-- CreateIndex
CREATE INDEX "PDFTemplatePage_pageOrder_idx" ON "PDFTemplatePage"("pageOrder");

-- CreateIndex
CREATE INDEX "SupportRequest_trainerId_idx" ON "SupportRequest"("trainerId");

-- CreateIndex
CREATE INDEX "FinancialRecord_trainerId_date_type_idx" ON "FinancialRecord"("trainerId", "date", "type");

-- CreateIndex
CREATE INDEX "FinancialRecord_trainerId_type_idx" ON "FinancialRecord"("trainerId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_email_key" ON "TeamMember"("email");

-- CreateIndex
CREATE INDEX "TeamMember_trainerId_idx" ON "TeamMember"("trainerId");

-- CreateIndex
CREATE INDEX "ClientTeamAssignment_trainerId_idx" ON "ClientTeamAssignment"("trainerId");

-- CreateIndex
CREATE INDEX "ClientTeamAssignment_clientId_idx" ON "ClientTeamAssignment"("clientId");

-- CreateIndex
CREATE INDEX "ClientTeamAssignment_teamMemberId_idx" ON "ClientTeamAssignment"("teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientTeamAssignment_clientId_teamMemberId_key" ON "ClientTeamAssignment"("clientId", "teamMemberId");

-- CreateIndex
CREATE INDEX "ClientProgramAssignment_trainerId_idx" ON "ClientProgramAssignment"("trainerId");

-- CreateIndex
CREATE INDEX "ClientProgramAssignment_clientId_idx" ON "ClientProgramAssignment"("clientId");

-- CreateIndex
CREATE INDEX "ClientProgramAssignment_programId_idx" ON "ClientProgramAssignment"("programId");

-- CreateIndex
CREATE INDEX "ClientNutritionAssignment_trainerId_idx" ON "ClientNutritionAssignment"("trainerId");

-- CreateIndex
CREATE INDEX "ClientNutritionAssignment_clientId_idx" ON "ClientNutritionAssignment"("clientId");

-- CreateIndex
CREATE INDEX "ClientNutritionAssignment_nutritionProgramId_idx" ON "ClientNutritionAssignment"("nutritionProgramId");

-- CreateIndex
CREATE INDEX "Task_trainerId_idx" ON "Task"("trainerId");

-- CreateIndex
CREATE INDEX "Task_assignedTo_idx" ON "Task"("assignedTo");

-- CreateIndex
CREATE INDEX "Task_clientId_idx" ON "Task"("clientId");

-- CreateIndex
CREATE INDEX "Task_leadId_idx" ON "Task"("leadId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_taskType_idx" ON "Task"("taskType");

-- CreateIndex
CREATE INDEX "Task_category_idx" ON "Task"("category");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_idx" ON "TaskComment"("taskId");

-- CreateIndex
CREATE INDEX "TaskComment_teamMemberId_idx" ON "TaskComment"("teamMemberId");

-- CreateIndex
CREATE INDEX "ManuallyDeletedTask_trainerId_idx" ON "ManuallyDeletedTask"("trainerId");

-- CreateIndex
CREATE INDEX "ManuallyDeletedTask_clientId_idx" ON "ManuallyDeletedTask"("clientId");

-- CreateIndex
CREATE INDEX "ManuallyDeletedTask_trainerId_clientId_category_taskType_idx" ON "ManuallyDeletedTask"("trainerId", "clientId", "category", "taskType");

-- CreateIndex
CREATE UNIQUE INDEX "ClientAuth_clientId_key" ON "ClientAuth"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientAuth_email_key" ON "ClientAuth"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClientAuth_phone_key" ON "ClientAuth"("phone");

-- CreateIndex
CREATE INDEX "ClientAuth_email_idx" ON "ClientAuth"("email");

-- CreateIndex
CREATE INDEX "ClientAuth_phone_idx" ON "ClientAuth"("phone");

-- CreateIndex
CREATE INDEX "WorkoutSession_clientId_idx" ON "WorkoutSession"("clientId");

-- CreateIndex
CREATE INDEX "WorkoutSession_assignmentId_idx" ON "WorkoutSession"("assignmentId");

-- CreateIndex
CREATE INDEX "WorkoutSession_dayId_idx" ON "WorkoutSession"("dayId");

-- CreateIndex
CREATE INDEX "WorkoutSession_status_idx" ON "WorkoutSession"("status");

-- CreateIndex
CREATE INDEX "ExerciseCompletion_sessionId_idx" ON "ExerciseCompletion"("sessionId");

-- CreateIndex
CREATE INDEX "ExerciseCompletion_exerciseId_idx" ON "ExerciseCompletion"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "_ClientLabels_AB_unique" ON "_ClientLabels"("A", "B");

-- CreateIndex
CREATE INDEX "_ClientLabels_B_index" ON "_ClientLabels"("B");
