-- CreateTable
CREATE TABLE "Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainerId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "TrainerClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
