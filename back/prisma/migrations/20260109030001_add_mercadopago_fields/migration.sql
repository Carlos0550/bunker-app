-- AlterTable
ALTER TABLE "PaymentHistory" ADD COLUMN "mercadoPagoPreferenceId" TEXT;
ALTER TABLE "PaymentHistory" ADD COLUMN "mercadoPagoPaymentId" TEXT;
ALTER TABLE "PaymentHistory" ADD COLUMN "mercadoPagoStatus" TEXT;
ALTER TABLE "PaymentHistory" ADD COLUMN "mercadoPagoPaymentType" TEXT;
ALTER TABLE "PaymentHistory" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
