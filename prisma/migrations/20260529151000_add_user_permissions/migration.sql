ALTER TABLE "User" ADD COLUMN "allowedDepartments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "totalAccess" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "canManagePermissions" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "totalAccess" = true,
    "canManagePermissions" = true
WHERE "role" = 'ADMIN';
