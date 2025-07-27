-- AlterTable
ALTER TABLE "PDFTemplate" ADD COLUMN     "uploadType" TEXT NOT NULL DEFAULT 'complete',
ALTER COLUMN "fileUrl" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PDFTemplatePage" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "pageName" TEXT NOT NULL,
    "pageOrder" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PDFTemplatePage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PDFTemplatePage_templateId_idx" ON "PDFTemplatePage"("templateId");

-- CreateIndex
CREATE INDEX "PDFTemplatePage_pageOrder_idx" ON "PDFTemplatePage"("pageOrder");

-- AddForeignKey
ALTER TABLE "PDFTemplatePage" ADD CONSTRAINT "PDFTemplatePage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PDFTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
