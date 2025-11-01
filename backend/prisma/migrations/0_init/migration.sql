-- CreateTable
CREATE TABLE "Registered" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phoneNumber" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountStatus" TEXT NOT NULL DEFAULT 'pending',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "Registered_pkey" PRIMARY KEY ("id")
);

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
    "level" TEXT,
    "registrationDate" TIMESTAMP(3),
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "originLeadId" INTEGER,

    CONSTRAINT "TrainerClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "durationValue" INTEGER NOT NULL DEFAULT 1,
    "durationUnit" TEXT NOT NULL DEFAULT 'month',
    "priceBeforeDisc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountApplied" BOOLEAN NOT NULL DEFAULT false,
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION,
    "priceAfterDisc" DOUBLE PRECISION,
    "followUpDays" INTEGER,
    "followUpFormId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "packageId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "durationValue" INTEGER NOT NULL,
    "durationUnit" TEXT NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "priceBeforeDisc" DOUBLE PRECISION,
    "discountApplied" BOOLEAN,
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION,
    "priceAfterDisc" DOUBLE PRECISION,
    "isOnHold" BOOLEAN NOT NULL DEFAULT false,
    "holdStartDate" TIMESTAMP(3),
    "holdEndDate" TIMESTAMP(3),
    "holdDuration" INTEGER,
    "holdDurationUnit" TEXT,
    "isCanceled" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "refundAmount" DOUBLE PRECISION,
    "refundType" TEXT,
    "renewalHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "paidDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "remaining" DOUBLE PRECISION NOT NULL,
    "nextInstallment" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionImage" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "imageData" BYTEA NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installmentId" INTEGER NOT NULL,

    CONSTRAINT "TransactionImage_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceEGP" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientService" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "serviceName" TEXT NOT NULL,
    "priceEGP" DOUBLE PRECISION NOT NULL,
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
CREATE TABLE "Lead" (
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
CREATE TABLE "LeadActivity" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "byTeamMemberId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "trainerId" INTEGER NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInForm" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "isMainForm" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckInForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInQuestion" (
    "id" SERIAL NOT NULL,
    "formId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,
    "options" JSONB,
    "conditionGroup" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckInQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInSubmission" (
    "id" SERIAL NOT NULL,
    "formId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "phoneNumber" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answers" JSONB NOT NULL,

    CONSTRAINT "CheckInSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInFormHistory" (
    "id" SERIAL NOT NULL,
    "formId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckInFormHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" SERIAL NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "cookingState" TEXT NOT NULL DEFAULT 'before_cook',
    "caloriesBefore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proteinBefore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbsBefore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fatsBefore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "caloriesAfter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proteinAfter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbsAfter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fatsAfter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sugar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sodium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitType" TEXT NOT NULL DEFAULT 'grams',
    "servingSize" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "costPerUnit" DOUBLE PRECISION,
    "allergens" TEXT DEFAULT '[]',
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pdfUrl" TEXT,
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "importedPdfUrl" TEXT,
    "programDuration" INTEGER,
    "durationUnit" TEXT,
    "originalProgramId" INTEGER,
    "customizedForClientId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionProgram" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pdfUrl" TEXT,
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "importedPdfUrl" TEXT,
    "programDuration" INTEGER,
    "durationUnit" TEXT DEFAULT 'weeks',
    "repeatCount" INTEGER DEFAULT 1,
    "targetCalories" DOUBLE PRECISION,
    "targetProtein" DOUBLE PRECISION,
    "targetCarbs" DOUBLE PRECISION,
    "targetFats" DOUBLE PRECISION,
    "proteinPercentage" DOUBLE PRECISION,
    "carbsPercentage" DOUBLE PRECISION,
    "fatsPercentage" DOUBLE PRECISION,
    "usePercentages" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "originalNutritionProgramId" INTEGER,
    "customizedForClientId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "prepTime" INTEGER,
    "cookTime" INTEGER,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "difficulty" TEXT,
    "instructions" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalCalories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalProtein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCarbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFats" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSugar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSodium" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealIngredient" (
    "id" SERIAL NOT NULL,
    "mealId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "MealIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionProgramWeek" (
    "id" SERIAL NOT NULL,
    "nutritionProgramId" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionProgramWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionProgramDay" (
    "id" SERIAL NOT NULL,
    "nutritionProgramWeekId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionProgramDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionProgramMeal" (
    "id" SERIAL NOT NULL,
    "nutritionProgramId" INTEGER NOT NULL,
    "nutritionProgramWeekId" INTEGER,
    "nutritionProgramDayId" INTEGER,
    "mealId" INTEGER,
    "mealType" TEXT NOT NULL,
    "order" INTEGER,
    "isCheatMeal" BOOLEAN NOT NULL DEFAULT false,
    "cheatDescription" TEXT,
    "cheatImageUrl" TEXT,
    "customQuantity" DOUBLE PRECISION,
    "customNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionProgramMeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramWeek" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramDay" (
    "id" SERIAL NOT NULL,
    "weekId" INTEGER NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "name" TEXT,
    "dayType" TEXT NOT NULL DEFAULT 'workout',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramExercise" (
    "id" SERIAL NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportRequest" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialRecord" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT,
    "clientId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialRecord_pkey" PRIMARY KEY ("id")
);

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
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "teamMemberId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientTeamAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientProgramAssignment" (
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
CREATE TABLE "ClientNutritionAssignment" (
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
CREATE TABLE "Task" (
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
CREATE TABLE "TaskComment" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "teamMemberId" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManuallyDeletedTask" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "category" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "originalTaskId" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManuallyDeletedTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientAuth" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "requiresPasswordReset" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "dayId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "resumedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalDuration" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseCompletion" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "setsCompleted" INTEGER NOT NULL DEFAULT 0,
    "repsCompleted" INTEGER,
    "weightUsed" DOUBLE PRECISION,
    "notes" TEXT,
    "duration" INTEGER,

    CONSTRAINT "ExerciseCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushToken" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentType" TEXT,
    "attachmentName" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "packageId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" SERIAL NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "config" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" SERIAL NOT NULL,
    "workflowId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "currentStepId" INTEGER,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "lastStepAt" TIMESTAMP(3),
    "data" TEXT,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignedForm" (
    "id" SERIAL NOT NULL,
    "workflowExecutionId" INTEGER,
    "formId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "message" TEXT,

    CONSTRAINT "AssignedForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClientLabels" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ClientLabels_AB_pkey" PRIMARY KEY ("A","B")
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
CREATE INDEX "Ingredient_trainerId_idx" ON "Ingredient"("trainerId");

-- CreateIndex
CREATE INDEX "Ingredient_category_idx" ON "Ingredient"("category");

-- CreateIndex
CREATE INDEX "Ingredient_name_idx" ON "Ingredient"("name");

-- CreateIndex
CREATE INDEX "Program_trainerId_idx" ON "Program"("trainerId");

-- CreateIndex
CREATE INDEX "Program_originalProgramId_idx" ON "Program"("originalProgramId");

-- CreateIndex
CREATE INDEX "Program_customizedForClientId_idx" ON "Program"("customizedForClientId");

-- CreateIndex
CREATE INDEX "NutritionProgram_trainerId_idx" ON "NutritionProgram"("trainerId");

-- CreateIndex
CREATE INDEX "NutritionProgram_originalNutritionProgramId_idx" ON "NutritionProgram"("originalNutritionProgramId");

-- CreateIndex
CREATE INDEX "NutritionProgram_customizedForClientId_idx" ON "NutritionProgram"("customizedForClientId");

-- CreateIndex
CREATE INDEX "Meal_trainerId_idx" ON "Meal"("trainerId");

-- CreateIndex
CREATE INDEX "Meal_category_idx" ON "Meal"("category");

-- CreateIndex
CREATE INDEX "Meal_name_idx" ON "Meal"("name");

-- CreateIndex
CREATE INDEX "MealIngredient_mealId_idx" ON "MealIngredient"("mealId");

-- CreateIndex
CREATE INDEX "MealIngredient_ingredientId_idx" ON "MealIngredient"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "MealIngredient_mealId_ingredientId_key" ON "MealIngredient"("mealId", "ingredientId");

-- CreateIndex
CREATE INDEX "NutritionProgramWeek_nutritionProgramId_idx" ON "NutritionProgramWeek"("nutritionProgramId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionProgramWeek_nutritionProgramId_weekNumber_key" ON "NutritionProgramWeek"("nutritionProgramId", "weekNumber");

-- CreateIndex
CREATE INDEX "NutritionProgramDay_nutritionProgramWeekId_idx" ON "NutritionProgramDay"("nutritionProgramWeekId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionProgramDay_nutritionProgramWeekId_dayOfWeek_key" ON "NutritionProgramDay"("nutritionProgramWeekId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "NutritionProgramMeal_nutritionProgramId_idx" ON "NutritionProgramMeal"("nutritionProgramId");

-- CreateIndex
CREATE INDEX "NutritionProgramMeal_mealId_idx" ON "NutritionProgramMeal"("mealId");

-- CreateIndex
CREATE INDEX "NutritionProgramMeal_nutritionProgramWeekId_idx" ON "NutritionProgramMeal"("nutritionProgramWeekId");

-- CreateIndex
CREATE INDEX "NutritionProgramMeal_nutritionProgramDayId_idx" ON "NutritionProgramMeal"("nutritionProgramDayId");

-- CreateIndex
CREATE INDEX "ProgramWeek_programId_idx" ON "ProgramWeek"("programId");

-- CreateIndex
CREATE INDEX "ProgramDay_weekId_idx" ON "ProgramDay"("weekId");

-- CreateIndex
CREATE INDEX "ProgramExercise_dayId_idx" ON "ProgramExercise"("dayId");

-- CreateIndex
CREATE INDEX "ProgramExercise_exerciseId_idx" ON "ProgramExercise"("exerciseId");

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
CREATE INDEX "Message_trainerId_idx" ON "Message"("trainerId");

-- CreateIndex
CREATE INDEX "Message_clientId_idx" ON "Message"("clientId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_isRead_idx" ON "Message"("isRead");

-- CreateIndex
CREATE INDEX "Message_trainerId_clientId_idx" ON "Message"("trainerId", "clientId");

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

-- CreateIndex
CREATE INDEX "AssignedForm_formId_idx" ON "AssignedForm"("formId");

-- CreateIndex
CREATE INDEX "AssignedForm_clientId_idx" ON "AssignedForm"("clientId");

-- CreateIndex
CREATE INDEX "AssignedForm_workflowExecutionId_idx" ON "AssignedForm"("workflowExecutionId");

-- CreateIndex
CREATE INDEX "_ClientLabels_B_index" ON "_ClientLabels"("B");

-- AddForeignKey
ALTER TABLE "TrainerClient" ADD CONSTRAINT "TrainerClient_originLeadId_fkey" FOREIGN KEY ("originLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerClient" ADD CONSTRAINT "TrainerClient_selectedFormId_fkey" FOREIGN KEY ("selectedFormId") REFERENCES "CheckInForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerClient" ADD CONSTRAINT "TrainerClient_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionImage" ADD CONSTRAINT "TransactionImage_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionTransactionImage" ADD CONSTRAINT "SubscriptionTransactionImage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHold" ADD CONSTRAINT "SubscriptionHold_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientService" ADD CONSTRAINT "ClientService_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientService" ADD CONSTRAINT "ClientService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientService" ADD CONSTRAINT "ClientService_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_byTeamMemberId_fkey" FOREIGN KEY ("byTeamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInForm" ADD CONSTRAINT "CheckInForm_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInQuestion" ADD CONSTRAINT "CheckInQuestion_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CheckInForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInSubmission" ADD CONSTRAINT "CheckInSubmission_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInSubmission" ADD CONSTRAINT "CheckInSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CheckInForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInFormHistory" ADD CONSTRAINT "CheckInFormHistory_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CheckInForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_customizedForClientId_fkey" FOREIGN KEY ("customizedForClientId") REFERENCES "TrainerClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionProgram" ADD CONSTRAINT "NutritionProgram_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionProgram" ADD CONSTRAINT "NutritionProgram_customizedForClientId_fkey" FOREIGN KEY ("customizedForClientId") REFERENCES "TrainerClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealIngredient" ADD CONSTRAINT "MealIngredient_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealIngredient" ADD CONSTRAINT "MealIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionProgramWeek" ADD CONSTRAINT "NutritionProgramWeek_nutritionProgramId_fkey" FOREIGN KEY ("nutritionProgramId") REFERENCES "NutritionProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionProgramDay" ADD CONSTRAINT "NutritionProgramDay_nutritionProgramWeekId_fkey" FOREIGN KEY ("nutritionProgramWeekId") REFERENCES "NutritionProgramWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionProgramMeal" ADD CONSTRAINT "NutritionProgramMeal_nutritionProgramId_fkey" FOREIGN KEY ("nutritionProgramId") REFERENCES "NutritionProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionProgramMeal" ADD CONSTRAINT "NutritionProgramMeal_nutritionProgramWeekId_fkey" FOREIGN KEY ("nutritionProgramWeekId") REFERENCES "NutritionProgramWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionProgramMeal" ADD CONSTRAINT "NutritionProgramMeal_nutritionProgramDayId_fkey" FOREIGN KEY ("nutritionProgramDayId") REFERENCES "NutritionProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionProgramMeal" ADD CONSTRAINT "NutritionProgramMeal_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramWeek" ADD CONSTRAINT "ProgramWeek_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramDay" ADD CONSTRAINT "ProgramDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "ProgramWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramExercise" ADD CONSTRAINT "ProgramExercise_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "ProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramExercise" ADD CONSTRAINT "ProgramExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTeamAssignment" ADD CONSTRAINT "ClientTeamAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTeamAssignment" ADD CONSTRAINT "ClientTeamAssignment_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTeamAssignment" ADD CONSTRAINT "ClientTeamAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProgramAssignment" ADD CONSTRAINT "ClientProgramAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProgramAssignment" ADD CONSTRAINT "ClientProgramAssignment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProgramAssignment" ADD CONSTRAINT "ClientProgramAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNutritionAssignment" ADD CONSTRAINT "ClientNutritionAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNutritionAssignment" ADD CONSTRAINT "ClientNutritionAssignment_nutritionProgramId_fkey" FOREIGN KEY ("nutritionProgramId") REFERENCES "NutritionProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNutritionAssignment" ADD CONSTRAINT "ClientNutritionAssignment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAuth" ADD CONSTRAINT "ClientAuth_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ClientProgramAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "ProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseCompletion" ADD CONSTRAINT "ExerciseCompletion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseCompletion" ADD CONSTRAINT "ExerciseCompletion_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "ProgramExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "WorkflowStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedForm" ADD CONSTRAINT "AssignedForm_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedForm" ADD CONSTRAINT "AssignedForm_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CheckInForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignedForm" ADD CONSTRAINT "AssignedForm_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientLabels" ADD CONSTRAINT "_ClientLabels_A_fkey" FOREIGN KEY ("A") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientLabels" ADD CONSTRAINT "_ClientLabels_B_fkey" FOREIGN KEY ("B") REFERENCES "TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

