/*
  Warnings:

  - You are about to drop the column `dayOfWeek` on the `NutritionProgramMeal` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `NutritionProgramMeal` table without a default value. This is not possible if the table is not empty.
  - Made the column `mealType` on table `NutritionProgramMeal` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "NutritionProgramWeek" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutritionProgramId" INTEGER NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionProgramWeek_nutritionProgramId_fkey" FOREIGN KEY ("nutritionProgramId") REFERENCES "NutritionProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutritionProgramDay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutritionProgramWeekId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionProgramDay_nutritionProgramWeekId_fkey" FOREIGN KEY ("nutritionProgramWeekId") REFERENCES "NutritionProgramWeek" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NutritionProgram" (
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
INSERT INTO "new_NutritionProgram" ("branding", "createdAt", "description", "durationUnit", "id", "importedPdfUrl", "isImported", "name", "pdfUrl", "programDuration", "template", "trainerId", "updatedAt") SELECT "branding", "createdAt", "description", "durationUnit", "id", "importedPdfUrl", "isImported", "name", "pdfUrl", "programDuration", "template", "trainerId", "updatedAt" FROM "NutritionProgram";
DROP TABLE "NutritionProgram";
ALTER TABLE "new_NutritionProgram" RENAME TO "NutritionProgram";
CREATE INDEX "NutritionProgram_trainerId_idx" ON "NutritionProgram"("trainerId");
CREATE TABLE "new_NutritionProgramMeal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutritionProgramId" INTEGER NOT NULL,
    "nutritionProgramWeekId" INTEGER,
    "nutritionProgramDayId" INTEGER,
    "mealId" INTEGER NOT NULL,
    "mealType" TEXT NOT NULL,
    "order" INTEGER,
    "isCheatMeal" BOOLEAN NOT NULL DEFAULT false,
    "cheatDescription" TEXT,
    "cheatImageUrl" TEXT,
    "customQuantity" REAL,
    "customNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionProgramMeal_nutritionProgramId_fkey" FOREIGN KEY ("nutritionProgramId") REFERENCES "NutritionProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NutritionProgramMeal_nutritionProgramWeekId_fkey" FOREIGN KEY ("nutritionProgramWeekId") REFERENCES "NutritionProgramWeek" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NutritionProgramMeal_nutritionProgramDayId_fkey" FOREIGN KEY ("nutritionProgramDayId") REFERENCES "NutritionProgramDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NutritionProgramMeal_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_NutritionProgramMeal" ("id", "mealId", "mealType", "nutritionProgramId", "order") SELECT "id", "mealId", "mealType", "nutritionProgramId", "order" FROM "NutritionProgramMeal";
DROP TABLE "NutritionProgramMeal";
ALTER TABLE "new_NutritionProgramMeal" RENAME TO "NutritionProgramMeal";
CREATE INDEX "NutritionProgramMeal_nutritionProgramId_idx" ON "NutritionProgramMeal"("nutritionProgramId");
CREATE INDEX "NutritionProgramMeal_mealId_idx" ON "NutritionProgramMeal"("mealId");
CREATE INDEX "NutritionProgramMeal_nutritionProgramWeekId_idx" ON "NutritionProgramMeal"("nutritionProgramWeekId");
CREATE INDEX "NutritionProgramMeal_nutritionProgramDayId_idx" ON "NutritionProgramMeal"("nutritionProgramDayId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "NutritionProgramWeek_nutritionProgramId_idx" ON "NutritionProgramWeek"("nutritionProgramId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionProgramWeek_nutritionProgramId_weekNumber_key" ON "NutritionProgramWeek"("nutritionProgramId", "weekNumber");

-- CreateIndex
CREATE INDEX "NutritionProgramDay_nutritionProgramWeekId_idx" ON "NutritionProgramDay"("nutritionProgramWeekId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionProgramDay_nutritionProgramWeekId_dayOfWeek_key" ON "NutritionProgramDay"("nutritionProgramWeekId", "dayOfWeek");
