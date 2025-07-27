-- AlterTable
ALTER TABLE "BrandingSettings" ADD COLUMN     "accentColor" TEXT NOT NULL DEFAULT '#F59E0B',
ADD COLUMN     "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
ADD COLUMN     "fontFamily" TEXT NOT NULL DEFAULT 'Arial',
ADD COLUMN     "fontSize" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "socialMedia" JSONB;
