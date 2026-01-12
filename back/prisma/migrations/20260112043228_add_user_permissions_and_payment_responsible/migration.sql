-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('POS', 'PRODUCTOS', 'VENTAS', 'CLIENTES', 'REPORTES', 'CONFIGURACION');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "paymentResponsibleUserId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_paymentResponsibleUserId_fkey" FOREIGN KEY ("paymentResponsibleUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
