-- DropIndex
DROP INDEX "idx_user_name_trgm";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileImage" TEXT;
