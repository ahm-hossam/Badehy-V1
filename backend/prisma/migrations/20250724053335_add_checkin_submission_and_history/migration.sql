-- CreateTable
CREATE TABLE "CheckInSubmission" (
    "id" SERIAL NOT NULL,
    "formId" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answers" JSONB NOT NULL,

    CONSTRAINT "CheckInSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInFormHistory" (
    "id" SERIAL NOT NULL,
    "formId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckInFormHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckInSubmission_formId_idx" ON "CheckInSubmission"("formId");

-- CreateIndex
CREATE INDEX "CheckInFormHistory_formId_idx" ON "CheckInFormHistory"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInFormHistory_formId_version_key" ON "CheckInFormHistory"("formId", "version");

-- AddForeignKey
ALTER TABLE "CheckInSubmission" ADD CONSTRAINT "CheckInSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CheckInForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInFormHistory" ADD CONSTRAINT "CheckInFormHistory_formId_fkey" FOREIGN KEY ("formId") REFERENCES "CheckInForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
