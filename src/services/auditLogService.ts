import { prisma } from "../prisma/client";

type AuditLogInput = {
  userId: string;
  action: string;
  accessItemId?: string;
  ipAddress?: string;
};

export async function createAuditLog(data: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      accessItemId: data.accessItemId,
      ipAddress: data.ipAddress
    }
  });
}
