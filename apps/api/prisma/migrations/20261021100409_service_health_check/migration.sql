-- CreateEnum
CREATE TYPE "MonitoredService" AS ENUM ('DATABASE', 'EMAIL', 'API_SERVER');

-- CreateEnum
CREATE TYPE "ServiceHealthStatus" AS ENUM ('UP', 'DOWN');

-- CreateTable
CREATE TABLE "service_health_checks" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "service" "MonitoredService" NOT NULL,
    "status" "ServiceHealthStatus" NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_health_checks_schoolId_service_checkedAt_idx" ON "service_health_checks"("schoolId", "service", "checkedAt");
