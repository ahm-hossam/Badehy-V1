-- CreateTable
CREATE TABLE "Meal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "totalCalories" REAL NOT NULL DEFAULT 0,
    "totalProtein" REAL NOT NULL DEFAULT 0,
    "totalCarbs" REAL NOT NULL DEFAULT 0,
    "totalFats" REAL NOT NULL DEFAULT 0,
    "totalFiber" REAL NOT NULL DEFAULT 0,
    "totalSugar" REAL NOT NULL DEFAULT 0,
    "totalSodium" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Meal_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealIngredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mealId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "MealIngredient_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutritionProgramMeal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutritionProgramId" INTEGER NOT NULL,
    "mealId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER,
    "mealType" TEXT,
    "order" INTEGER,
    CONSTRAINT "NutritionProgramMeal_nutritionProgramId_fkey" FOREIGN KEY ("nutritionProgramId") REFERENCES "NutritionProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NutritionProgramMeal_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
CREATE INDEX "NutritionProgramMeal_nutritionProgramId_idx" ON "NutritionProgramMeal"("nutritionProgramId");

-- CreateIndex
CREATE INDEX "NutritionProgramMeal_mealId_idx" ON "NutritionProgramMeal"("mealId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionProgramMeal_nutritionProgramId_mealId_dayOfWeek_mealType_key" ON "NutritionProgramMeal"("nutritionProgramId", "mealId", "dayOfWeek", "mealType");
