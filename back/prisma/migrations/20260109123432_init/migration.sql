-- AlterTable
ALTER TABLE "PaymentHistory" ADD COLUMN     "isTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextPaymentDate" TIMESTAMP(3);
