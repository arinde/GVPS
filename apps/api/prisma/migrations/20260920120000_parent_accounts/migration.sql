CREATE TABLE "parent_accounts" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parent_refresh_tokens" (
    "id" TEXT NOT NULL,
    "parentAccountId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "parent_accounts_schoolId_phone_key" ON "parent_accounts"("schoolId", "phone");
CREATE UNIQUE INDEX "parent_refresh_tokens_tokenHash_key" ON "parent_refresh_tokens"("tokenHash");

ALTER TABLE "parent_accounts" ADD CONSTRAINT "parent_accounts_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "parent_refresh_tokens" ADD CONSTRAINT "parent_refresh_tokens_parentAccountId_fkey"
  FOREIGN KEY ("parentAccountId") REFERENCES "parent_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
