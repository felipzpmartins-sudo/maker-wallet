-- AlterEnum
ALTER TYPE "AccessType" ADD VALUE 'WIFI';

-- AlterTable
ALTER TABLE "AccessItem" ADD COLUMN "departmentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
