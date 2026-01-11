/*
  Warnings:

  - You are about to drop the `Feature` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlanFeature` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_businessPlanId_fkey";

-- DropForeignKey
ALTER TABLE "PlanFeature" DROP CONSTRAINT "PlanFeature_featureId_fkey";

-- DropForeignKey
ALTER TABLE "PlanFeature" DROP CONSTRAINT "PlanFeature_planId_fkey";

-- DropIndex
DROP INDEX "Products_name_gin_idx";

-- AlterTable
ALTER TABLE "BusinessPlan" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CurrentAccount" ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PaymentHistory" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "Feature";

-- DropTable
DROP TABLE "PlanFeature";

-- DropEnum
DROP TYPE "FeatureValueType";

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_businessPlanId_fkey" FOREIGN KEY ("businessPlanId") REFERENCES "BusinessPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
