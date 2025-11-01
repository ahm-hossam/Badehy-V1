-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NutritionProgramMeal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutritionProgramId" INTEGER NOT NULL,
    "nutritionProgramWeekId" INTEGER,
    "nutritionProgramDayId" INTEGER,
    "mealId" INTEGER,
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
INSERT INTO "new_NutritionProgramMeal" ("cheatDescription", "cheatImageUrl", "createdAt", "customNotes", "customQuantity", "id", "isCheatMeal", "mealId", "mealType", "nutritionProgramDayId", "nutritionProgramId", "nutritionProgramWeekId", "order", "updatedAt") SELECT "cheatDescription", "cheatImageUrl", "createdAt", "customNotes", "customQuantity", "id", "isCheatMeal", "mealId", "mealType", "nutritionProgramDayId", "nutritionProgramId", "nutritionProgramWeekId", "order", "updatedAt" FROM "NutritionProgramMeal";
DROP TABLE "NutritionProgramMeal";
ALTER TABLE "new_NutritionProgramMeal" RENAME TO "NutritionProgramMeal";
CREATE INDEX "NutritionProgramMeal_nutritionProgramId_idx" ON "NutritionProgramMeal"("nutritionProgramId");
CREATE INDEX "NutritionProgramMeal_mealId_idx" ON "NutritionProgramMeal"("mealId");
CREATE INDEX "NutritionProgramMeal_nutritionProgramWeekId_idx" ON "NutritionProgramMeal"("nutritionProgramWeekId");
CREATE INDEX "NutritionProgramMeal_nutritionProgramDayId_idx" ON "NutritionProgramMeal"("nutritionProgramDayId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
