import { UserRole } from "@prisma/client";
import { prisma } from "../prisma/client";

export type PermissionAction = "view" | "edit" | "delete";

export async function canAccess(
  user: Express.User,
  accessItemId: string,
  action: PermissionAction
) {
  const accessItem = await prisma.accessItem.findUnique({
    where: { id: accessItemId },
    select: { createdById: true }
  });

  if (!accessItem) {
    return false;
  }

  const permission = await prisma.accessPermission.findUnique({
    where: {
      userId_accessItemId: {
        userId: user.id,
        accessItemId
      }
    }
  });

  if (user.totalAccess) {
    return permission ? permission.canView : true;
  }

  if (permission && !permission.canView && !permission.canEdit && !permission.canDelete) {
    return false;
  }

  if (accessItem.createdById === user.id && user.role !== UserRole.RESTRICTED) {
    return true;
  }

  if (!permission) {
    return false;
  }

  if (action === "view") return permission.canView;
  if (action === "edit") return permission.canEdit;
  return permission.canDelete;
}

export async function upsertPermission(input: {
  accessItemId: string;
  userId: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return prisma.accessPermission.upsert({
    where: {
      userId_accessItemId: {
        userId: input.userId,
        accessItemId: input.accessItemId
      }
    },
    create: input,
    update: {
      canView: input.canView,
      canEdit: input.canEdit,
      canDelete: input.canDelete
    }
  });
}
