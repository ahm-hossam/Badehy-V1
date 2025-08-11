-- CreateTable
CREATE TABLE "public"."FinancialRecord" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT,
    "clientId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialRecord_trainerId_date_type_idx" ON "public"."FinancialRecord"("trainerId", "date", "type");

-- CreateIndex
CREATE INDEX "FinancialRecord_trainerId_type_idx" ON "public"."FinancialRecord"("trainerId", "type");

-- AddForeignKey
ALTER TABLE "public"."FinancialRecord" ADD CONSTRAINT "FinancialRecord_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "public"."Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinancialRecord" ADD CONSTRAINT "FinancialRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."TrainerClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
