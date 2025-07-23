-- CreateTable
CREATE TABLE "CheckIn" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckIn_trainerId_idx" ON "CheckIn"("trainerId");

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
