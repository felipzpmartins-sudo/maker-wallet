import { AccessType, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../prisma/client";
import { AppError } from "../utils/errors";
import { decryptPassword, encryptPassword } from "../utils/passwordCrypto";
import { sanitizeAccessItem } from "../utils/sanitize";
import { canAccess, upsertPermission } from "./permissionService";
import { createAuditLog } from "./auditLogService";
import { verifyMfaOrThrow } from "./mfaService";

type AccessInput = {
  type: AccessType;
  title: string;
  description?: string;
  host?: string;
  port?: number;
  username?: string;
  email?: string;
  password?: string;
  loginUrl?: string;
  observation?: string;
  appName?: string;
  keystoreFilePath?: string;
  departmentIds?: string[];
};

type AccessQuery = {
  type?: AccessType;
  search?: string;
  userId?: string;
  createdBy?: string;
  page: number;
  limit: number;
};

function buildAccessData(data: Partial<AccessInput>) {
  const accessData: Prisma.AccessItemUncheckedCreateInput | Prisma.AccessItemUncheckedUpdateInput = {
    type: data.type,
    title: data.title,
    description: data.description,
    host: data.host,
    port: data.port,
    username: data.username,
    email: data.email,
    loginUrl: data.loginUrl,
    observation: data.observation,
    appName: data.appName,
    keystoreFilePath: data.keystoreFilePath,
    departmentIds: data.departmentIds
  };

  if (data.password) {
    accessData.encryptedPassword = encryptPassword(data.password);
  }

  return accessData;
}

export async function createAccess(data: AccessInput, user: Express.User, ipAddress?: string) {
  if (user.role === UserRole.RESTRICTED) {
    throw new AppError(403, "Restricted users cannot create access items");
  }

  const accessItem = await prisma.accessItem.create({
    data: {
      ...buildAccessData(data),
      createdById: user.id
    } as Prisma.AccessItemUncheckedCreateInput
  });

  await createAuditLog({
    userId: user.id,
    action: "ACCESS_CREATED",
    accessItemId: accessItem.id,
    ipAddress
  });

  return sanitizeAccessItem(accessItem);
}

export async function listAccess(query: AccessQuery, user: Express.User) {
  if (user.role === UserRole.ADMIN && !query.userId) {
    return listAdminAccess(query);
  }

  const andFilters: Prisma.AccessItemWhereInput[] = [];

  if (query.type) {
    andFilters.push({ type: query.type });
  }

  if (query.createdBy) {
    andFilters.push({ createdById: query.createdBy });
  }

  if (query.search) {
    andFilters.push({
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { host: { contains: query.search, mode: "insensitive" } },
        { username: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { appName: { contains: query.search, mode: "insensitive" } }
      ]
    });
  }

  if (user.role !== UserRole.ADMIN) {
    andFilters.push({
      OR: [
        { createdById: user.id },
        {
          permissions: {
            some: {
              userId: user.id,
              canView: true
            }
          }
        }
      ]
    });
  }

  if (query.userId) {
    andFilters.push({
      permissions: {
        some: {
          userId: query.userId,
          canView: true
        }
      }
    });
  }

  const where: Prisma.AccessItemWhereInput = andFilters.length > 0 ? { AND: andFilters } : {};

  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    prisma.accessItem.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.accessItem.count({ where })
  ]);

  return {
    items: items.map(sanitizeAccessItem),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit)
    }
  };
}

async function listAdminAccess(query: AccessQuery) {
  const page = query.page;
  const limit = query.limit;
  const offset = (page - 1) * limit;
  const filters: Prisma.Sql[] = [];

  if (query.type) {
    filters.push(Prisma.sql`"type" = ${query.type}::"AccessType"`);
  }

  if (query.createdBy) {
    filters.push(Prisma.sql`"createdById" = ${query.createdBy}`);
  }

  if (query.search) {
    const search = `%${query.search}%`;
    filters.push(Prisma.sql`(
      "title" ILIKE ${search}
      OR "description" ILIKE ${search}
      OR "host" ILIKE ${search}
      OR "username" ILIKE ${search}
      OR "email" ILIKE ${search}
      OR "appName" ILIKE ${search}
    )`);
  }

  const where = filters.length
    ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
    : Prisma.empty;

  const items = await prisma.$queryRaw<Prisma.AccessItemGetPayload<Record<string, never>>[]>`
    SELECT
      "id",
      "type",
      "title",
      "description",
      "host",
      "port",
      "username",
      "email",
      "encryptedPassword",
      "loginUrl",
      "observation",
      "appName",
      "keystoreFilePath",
      "departmentIds",
      "createdById",
      "createdAt",
      "updatedAt"
    FROM "AccessItem"
    ${where}
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const totalRows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "AccessItem"
    ${where}
  `;
  const total = Number(totalRows[0]?.count ?? 0);

  return {
    items: items.map(sanitizeAccessItem),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function getAccess(id: string, user: Express.User) {
  const allowed = await canAccess(user, id, "view");

  if (!allowed) {
    throw new AppError(403, "Access denied");
  }

  const accessItem = await prisma.accessItem.findUnique({
    where: { id }
  });

  if (!accessItem) {
    throw new AppError(404, "Access item not found");
  }

  return sanitizeAccessItem(accessItem);
}

export async function updateAccess(
  id: string,
  data: Partial<AccessInput>,
  user: Express.User,
  ipAddress?: string
) {
  const allowed = await canAccess(user, id, "edit");

  if (!allowed) {
    throw new AppError(403, "Access denied");
  }

  const accessItem = await prisma.accessItem.update({
    where: { id },
    data: buildAccessData(data)
  });

  await createAuditLog({
    userId: user.id,
    action: "ACCESS_UPDATED",
    accessItemId: id,
    ipAddress
  });

  return sanitizeAccessItem(accessItem);
}

export async function deleteAccess(id: string, user: Express.User, ipAddress?: string) {
  const allowed = await canAccess(user, id, "delete");

  if (!allowed) {
    throw new AppError(403, "Access denied");
  }

  await prisma.accessItem.delete({
    where: { id }
  });

  await createAuditLog({
    userId: user.id,
    action: "ACCESS_DELETED",
    accessItemId: id,
    ipAddress
  });
}

export async function revealPassword(
  id: string,
  user: Express.User,
  mfaCode: string | undefined,
  ipAddress?: string
) {
  const allowed = await canAccess(user, id, "view");

  if (!allowed) {
    throw new AppError(403, "Access denied");
  }

  await verifyMfaOrThrow(user.id, mfaCode, ipAddress);

  const accessItem = await prisma.accessItem.findUnique({
    where: { id }
  });

  if (!accessItem) {
    throw new AppError(404, "Access item not found");
  }

  if (!accessItem.encryptedPassword) {
    throw new AppError(404, "This access item has no stored password");
  }

  await createAuditLog({
    userId: user.id,
    action: "PASSWORD_REVEALED",
    accessItemId: id,
    ipAddress
  });

  return {
    password: decryptPassword(accessItem.encryptedPassword)
  };
}

export async function registerCopyLog(id: string, user: Express.User, ipAddress?: string) {
  const allowed = await canAccess(user, id, "view");

  if (!allowed) {
    throw new AppError(403, "Access denied");
  }

  await createAuditLog({
    userId: user.id,
    action: "CREDENTIAL_COPIED",
    accessItemId: id,
    ipAddress
  });
}

export async function setPermission(
  accessItemId: string,
  data: { userId: string; canView: boolean; canEdit: boolean; canDelete: boolean },
  user: Express.User,
  ipAddress?: string
) {
  const allowed = user.role === UserRole.ADMIN || (await canAccess(user, accessItemId, "edit"));

  if (!allowed) {
    throw new AppError(403, "Access denied");
  }

  const permission = await upsertPermission({
    accessItemId,
    ...data
  });

  await createAuditLog({
    userId: user.id,
    action: "PERMISSION_CHANGED",
    accessItemId,
    ipAddress
  });

  return permission;
}

export async function attachKeystore(
  accessItemId: string,
  filePath: string,
  user: Express.User,
  ipAddress?: string
) {
  const allowed = await canAccess(user, accessItemId, "edit");

  if (!allowed) {
    throw new AppError(403, "Access denied");
  }

  const accessItem = await prisma.accessItem.update({
    where: { id: accessItemId },
    data: {
      type: AccessType.KEYSTORE,
      keystoreFilePath: filePath
    }
  });

  await createAuditLog({
    userId: user.id,
    action: "KEYSTORE_UPLOADED",
    accessItemId,
    ipAddress
  });

  return sanitizeAccessItem(accessItem);
}
