-- CreateTable
CREATE TABLE "Ingredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "cookingState" TEXT NOT NULL DEFAULT 'before_cook',
    "caloriesBefore" REAL NOT NULL DEFAULT 0,
    "proteinBefore" REAL NOT NULL DEFAULT 0,
    "carbsBefore" REAL NOT NULL DEFAULT 0,
    "fatsBefore" REAL NOT NULL DEFAULT 0,
    "caloriesAfter" REAL NOT NULL DEFAULT 0,
    "proteinAfter" REAL NOT NULL DEFAULT 0,
    "carbsAfter" REAL NOT NULL DEFAULT 0,
    "fatsAfter" REAL NOT NULL DEFAULT 0,
    "fiber" REAL NOT NULL DEFAULT 0,
    "sugar" REAL NOT NULL DEFAULT 0,
    "sodium" REAL NOT NULL DEFAULT 0,
    "unitType" TEXT NOT NULL DEFAULT 'grams',
    "servingSize" REAL NOT NULL DEFAULT 100,
    "costPerUnit" REAL,
    "allergens" TEXT DEFAULT '[]',
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ingredient_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Ingredient_trainerId_idx" ON "Ingredient"("trainerId");

-- CreateIndex
CREATE INDEX "Ingredient_category_idx" ON "Ingredient"("category");

-- CreateIndex
CREATE INDEX "Ingredient_name_idx" ON "Ingredient"("name");
