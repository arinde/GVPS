-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'FINALISED');

-- CreateTable
CREATE TABLE "staff_salaries" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "basicKobo" INTEGER NOT NULL,
    "allowances" JSONB NOT NULL,
    "deductions" JSONB NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_salaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "finalisedAt" TIMESTAMP(3),
    "finalisedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "basicKobo" INTEGER NOT NULL,
    "allowances" JSONB NOT NULL,
    "deductions" JSONB NOT NULL,
    "grossKobo" INTEGER NOT NULL,
    "deductionsKobo" INTEGER NOT NULL,
    "netKobo" INTEGER NOT NULL,
    "staff" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_salaries_staffId_key" ON "staff_salaries"("staffId");

-- CreateIndex
CREATE INDEX "staff_salaries_schoolId_idx" ON "staff_salaries"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_schoolId_year_month_key" ON "payroll_runs"("schoolId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_runId_staffId_key" ON "payslips"("runId", "staffId");

-- CreateIndex
CREATE INDEX "payslips_schoolId_staffId_idx" ON "payslips"("schoolId", "staffId");

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_runId_fkey" FOREIGN KEY ("runId") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
