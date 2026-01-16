/*
  Warnings:

  - You are about to drop the column `multipliers` on the `Products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "multipliers" JSONB;

-- AlterTable
ALTER TABLE "Products" DROP COLUMN "multipliers";
