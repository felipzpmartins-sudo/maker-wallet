CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'RESTRICTED');
CREATE TYPE "AccessType" AS ENUM ('SSH', 'FTP', 'EMAIL', 'PLATFORM', 'KEYSTORE');
CREATE TYPE "RenewalServiceType" AS ENUM ('EMAIL', 'DOMAIN', 'HOSTING', 'DEVELOPER_ACCOUNT', 'SOFTWARE', 'CERTIFICATE', 'OTHER');
CREATE TYPE "RenewalInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'BIENNIAL', 'CUSTOM');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "mfaSecret" TEXT,
  "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessItem" (
  "id" TEXT NOT NULL,
  "type" "AccessType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "host" TEXT,
  "port" INTEGER,
  "username" TEXT,
  "email" TEXT,
  "encryptedPassword" TEXT,
  "loginUrl" TEXT,
  "observation" TEXT,
  "appName" TEXT,
  "keystoreFilePath" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AccessItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessPermission" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessItemId" TEXT NOT NULL,
  "canView" BOOLEAN NOT NULL DEFAULT false,
  "canEdit" BOOLEAN NOT NULL DEFAULT false,
  "canDelete" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "AccessPermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RenewalService" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "RenewalServiceType" NOT NULL,
  "provider" TEXT,
  "description" TEXT,
  "renewalUrl" TEXT,
  "amount" DECIMAL(10,2),
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "renewalInterval" "RenewalInterval" NOT NULL DEFAULT 'YEARLY',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "notifyDaysBefore" INTEGER NOT NULL DEFAULT 30,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "accessItemId" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RenewalService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "accessItemId" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "AccessItem_type_idx" ON "AccessItem"("type");
CREATE INDEX "AccessItem_createdById_idx" ON "AccessItem"("createdById");
CREATE UNIQUE INDEX "AccessPermission_userId_accessItemId_key" ON "AccessPermission"("userId", "accessItemId");
CREATE INDEX "AccessPermission_accessItemId_idx" ON "AccessPermission"("accessItemId");
CREATE INDEX "RenewalService_expiresAt_idx" ON "RenewalService"("expiresAt");
CREATE INDEX "RenewalService_type_idx" ON "RenewalService"("type");
CREATE INDEX "RenewalService_accessItemId_idx" ON "RenewalService"("accessItemId");
CREATE INDEX "RenewalService_createdById_idx" ON "RenewalService"("createdById");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_accessItemId_idx" ON "AuditLog"("accessItemId");

ALTER TABLE "AccessItem" ADD CONSTRAINT "AccessItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AccessPermission" ADD CONSTRAINT "AccessPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessPermission" ADD CONSTRAINT "AccessPermission_accessItemId_fkey" FOREIGN KEY ("accessItemId") REFERENCES "AccessItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RenewalService" ADD CONSTRAINT "RenewalService_accessItemId_fkey" FOREIGN KEY ("accessItemId") REFERENCES "AccessItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RenewalService" ADD CONSTRAINT "RenewalService_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
