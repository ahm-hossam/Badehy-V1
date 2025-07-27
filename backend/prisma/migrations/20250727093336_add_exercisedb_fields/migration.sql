-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "bodyPart" TEXT,
ADD COLUMN     "equipment" TEXT,
ADD COLUMN     "gifUrl" TEXT,
ADD COLUMN     "instructions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "secondaryMuscles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "source" TEXT,
ADD COLUMN     "target" TEXT;
