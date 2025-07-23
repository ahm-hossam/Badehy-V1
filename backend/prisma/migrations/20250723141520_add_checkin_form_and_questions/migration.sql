-- CreateTable
CREATE TABLE "CheckInForm" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
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

-- CreateIndex
CREATE INDEX "CheckInQuestion_formId_idx" ON "CheckInQuestion"("formId");

-- CreateIndex
CREATE INDEX "CheckInQuestion_order_idx" ON "CheckInQuestion"("order");

-- AddForeignKey
ALTER TABLE "CheckInForm" ADD CONSTRAINT "CheckInForm_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInQuestion" ADD CONSTRAINT "CheckInQuestion_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CheckInForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
