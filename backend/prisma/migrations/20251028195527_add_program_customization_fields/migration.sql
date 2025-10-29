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
    "originalNutritionProgramId" INTEGER,
    "customizedForClientId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionProgram_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NutritionProgram_customizedForClientId_fkey" FOREIGN KEY ("customizedForClientId") REFERENCES "TrainerClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_NutritionProgram" ("carbsPercentage", "createdAt", "description", "durationUnit", "fatsPercentage", "id", "importedPdfUrl", "isActive", "isImported", "name", "pdfUrl", "programDuration", "proteinPercentage", "repeatCount", "targetCalories", "targetCarbs", "targetFats", "targetProtein", "trainerId", "updatedAt", "usePercentages") SELECT "carbsPercentage", "createdAt", "description", "durationUnit", "fatsPercentage", "id", "importedPdfUrl", "isActive", "isImported", "name", "pdfUrl", "programDuration", "proteinPercentage", "repeatCount", "targetCalories", "targetCarbs", "targetFats", "targetProtein", "trainerId", "updatedAt", "usePercentages" FROM "NutritionProgram";
DROP TABLE "NutritionProgram";
ALTER TABLE "new_NutritionProgram" RENAME TO "NutritionProgram";
CREATE INDEX "NutritionProgram_trainerId_idx" ON "NutritionProgram"("trainerId");
CREATE INDEX "NutritionProgram_originalNutritionProgramId_idx" ON "NutritionProgram"("originalNutritionProgramId");
CREATE INDEX "NutritionProgram_customizedForClientId_idx" ON "NutritionProgram"("customizedForClientId");
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
    "originalProgramId" INTEGER,
    "customizedForClientId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Program_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Program_customizedForClientId_fkey" FOREIGN KEY ("customizedForClientId") REFERENCES "TrainerClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Program" ("createdAt", "description", "durationUnit", "id", "importedPdfUrl", "isDefault", "isImported", "name", "pdfUrl", "programDuration", "trainerId", "updatedAt") SELECT "createdAt", "description", "durationUnit", "id", "importedPdfUrl", "isDefault", "isImported", "name", "pdfUrl", "programDuration", "trainerId", "updatedAt" FROM "Program";
DROP TABLE "Program";
ALTER TABLE "new_Program" RENAME TO "Program";
CREATE INDEX "Program_trainerId_idx" ON "Program"("trainerId");
CREATE INDEX "Program_originalProgramId_idx" ON "Program"("originalProgramId");
CREATE INDEX "Program_customizedForClientId_idx" ON "Program"("customizedForClientId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
