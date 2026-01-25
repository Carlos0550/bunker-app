/*
  Warnings:

  - A unique constraint covering the columns `[businessId,name]` on the table `Products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,sku]` on the table `Products` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Products_businessId_name_idx";

-- DropIndex
DROP INDEX "Products_sku_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Products_businessId_name_key" ON "Products"("businessId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Products_businessId_sku_key" ON "Products"("businessId", "sku");
