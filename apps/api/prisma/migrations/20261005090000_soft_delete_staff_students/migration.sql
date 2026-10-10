-- AlterTable
ALTER TABLE "students" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "staff" ADD COLUMN "deletedAt" TIMESTAMP(3);
