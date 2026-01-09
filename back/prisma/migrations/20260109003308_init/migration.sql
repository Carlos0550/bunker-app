-- CreateEnum
CREATE TYPE "ProductState" AS ENUM ('ACTIVE', 'DISABLED', 'DELETED', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateTable
CREATE TABLE "Categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "payment_terms" TEXT,
    "delivery_days" INTEGER,
    "minimum_order" DOUBLE PRECISION,
    "status" "ProviderStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "bar_code" TEXT,
    "image" TEXT,
    "category_id" TEXT,
    "description" TEXT,
    "state" "ProductState" NOT NULL DEFAULT 'ACTIVE',
    "sku" TEXT,
    "supplier_id" TEXT,
    "cost_price" DOUBLE PRECISION,
    "sale_price" DOUBLE PRECISION,
    "min_stock" INTEGER,
    "reserved_stock" INTEGER,
    "notes" TEXT,
    "system_message" TEXT,
    "multipliers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Products_pkey" PRIMARY KEY ("id")
);
