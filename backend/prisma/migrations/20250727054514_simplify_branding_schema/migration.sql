/*
  Warnings:

  - You are about to drop the column `accentColor` on the `BrandingSettings` table. All the data in the column will be lost.
  - You are about to drop the column `backgroundColor` on the `BrandingSettings` table. All the data in the column will be lost.
  - You are about to drop the column `customFooter` on the `BrandingSettings` table. All the data in the column will be lost.
  - You are about to drop the column `customHeader` on the `BrandingSettings` table. All the data in the column will be lost.
  - You are about to drop the column `fontFamily` on the `BrandingSettings` table. All the data in the column will be lost.
  - You are about to drop the column `fontSize` on the `BrandingSettings` table. All the data in the column will be lost.
  - You are about to drop the column `primaryColor` on the `BrandingSettings` table. All the data in the column will be lost.
  - You are about to drop the column `secondaryColor` on the `BrandingSettings` table. All the data in the column will be lost.
  - You are about to drop the column `socialMedia` on the `BrandingSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BrandingSettings" DROP COLUMN "accentColor",
DROP COLUMN "backgroundColor",
DROP COLUMN "customFooter",
DROP COLUMN "customHeader",
DROP COLUMN "fontFamily",
DROP COLUMN "fontSize",
DROP COLUMN "primaryColor",
DROP COLUMN "secondaryColor",
DROP COLUMN "socialMedia";
