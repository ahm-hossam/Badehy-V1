-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Workflow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "packageId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workflow_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Workflow_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Workflow" ("createdAt", "description", "id", "isActive", "name", "packageId", "trainerId", "updatedAt") SELECT "createdAt", "description", "id", "isActive", "name", "packageId", "trainerId", "updatedAt" FROM "Workflow";
DROP TABLE "Workflow";
ALTER TABLE "new_Workflow" RENAME TO "Workflow";
CREATE INDEX "Workflow_trainerId_idx" ON "Workflow"("trainerId");
CREATE INDEX "Workflow_packageId_idx" ON "Workflow"("packageId");
CREATE INDEX "Workflow_isActive_idx" ON "Workflow"("isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
