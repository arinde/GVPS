-- AlterTable: add nullable first so the existing row can be backfilled
ALTER TABLE "payments" ADD COLUMN     "payerName" TEXT,
ADD COLUMN     "receivedByName" TEXT;

-- Backfill: existing rows predate this audit requirement
UPDATE "payments" SET "payerName" = 'Not recorded', "receivedByName" = 'Not recorded'
WHERE "payerName" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "payments" ALTER COLUMN "payerName" SET NOT NULL,
ALTER COLUMN "receivedByName" SET NOT NULL;
