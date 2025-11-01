-- CreateTable
CREATE TABLE "AssignedForm" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workflowExecutionId" INTEGER,
    "formId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "message" TEXT,
    CONSTRAINT "AssignedForm_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "WorkflowExecution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AssignedForm_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CheckInForm" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssignedForm_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AssignedForm_formId_idx" ON "AssignedForm"("formId");

-- CreateIndex
CREATE INDEX "AssignedForm_clientId_idx" ON "AssignedForm"("clientId");

-- CreateIndex
CREATE INDEX "AssignedForm_workflowExecutionId_idx" ON "AssignedForm"("workflowExecutionId");
