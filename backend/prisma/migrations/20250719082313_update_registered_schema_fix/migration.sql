/*
  Warnings:

  - You are about to drop the column `phone` on the `Registered` table. All the data in the column will be lost.
  - Added the required column `phoneNumber` to the `Registered` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Registered` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Registered_phone_key";

-- First, add the new columns with default values
ALTER TABLE "Registered" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Registered" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "Registered" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Copy existing phone data to phoneNumber
UPDATE "Registered" SET "phoneNumber" = "phone" WHERE "phoneNumber" IS NULL;

-- Make phoneNumber NOT NULL after copying data
ALTER TABLE "Registered" ALTER COLUMN "phoneNumber" SET NOT NULL;

-- Now drop the old phone column
ALTER TABLE "Registered" DROP COLUMN "phone";
