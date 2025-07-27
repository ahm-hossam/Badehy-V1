-- CreateTable
CREATE TABLE "BrandingSettings" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1F2937',
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "website" TEXT,
    "address" TEXT,
    "customHeader" TEXT,
    "customFooter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PDFTemplate" (
    "id" SERIAL NOT NULL,
    "trainerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PDFTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandingSettings_trainerId_idx" ON "BrandingSettings"("trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandingSettings_trainerId_key" ON "BrandingSettings"("trainerId");

-- CreateIndex
CREATE INDEX "PDFTemplate_trainerId_idx" ON "PDFTemplate"("trainerId");

-- AddForeignKey
ALTER TABLE "BrandingSettings" ADD CONSTRAINT "BrandingSettings_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PDFTemplate" ADD CONSTRAINT "PDFTemplate_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Registered"("id") ON DELETE CASCADE ON UPDATE CASCADE;
