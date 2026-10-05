-- AlterTable
ALTER TABLE "schools" ADD COLUMN "address" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "taxNumber" TEXT,
ADD COLUMN "vatRateBps" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "receipt" JSONB;
