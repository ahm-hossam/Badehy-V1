-- CreateTable
CREATE TABLE "Label" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "trainerId" INTEGER NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClientLabels" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ClientLabels_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Label_trainerId_idx" ON "Label"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "Label_trainerId_name_key" ON "Label"("trainerId", "name");

-- CreateIndex
CREATE INDEX "_ClientLabels_B_index" ON "_ClientLabels"("B");

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientLabels" ADD CONSTRAINT "_ClientLabels_A_fkey" FOREIGN KEY ("A") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientLabels" ADD CONSTRAINT "_ClientLabels_B_fkey" FOREIGN KEY ("B") REFERENCES "TrainerClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
