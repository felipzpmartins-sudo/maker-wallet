import { Prisma, RenewalInterval, RenewalServiceType, UserRole } from "@prisma/client";
import { prisma } from "../prisma/client";
import { AppError } from "../utils/errors";
import { createAuditLog } from "./auditLogService";

type RenewalServiceInput = {
  name: string;
  type: RenewalServiceType;
  provider?: string;
  description?: string;
  renewalUrl?: string;
  amount?: number;
  currency?: string;
  renewalInterval?: RenewalInterval;
  expiresAt: Date;
  notifyDaysBefore?: number;
  notes?: string;
  isActive?: boolean;
  accessItemId?: string;
};

type RenewalServiceQuery = {
  type?: RenewalServiceType;
  status?: "active" | "expiring" | "expired" | "inactive";
  search?: string;
  page: number;
  limit: number;
};

function daysUntil(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function getStatus(service: { expiresAt: Date; notifyDaysBefore: number; isActive: boolean }) {
  if (!service.isActive) return "inactive";

  const remainingDays = daysUntil(service.expiresAt);
  if (remainingDays < 0) return "expired";
  if (remainingDays <= service.notifyDaysBefore) return "expiring";
  return "active";
}

function serializeRenewalService<T extends { amount: Prisma.Decimal | null; expiresAt: Date; notifyDaysBefore: number; isActive: boolean }>(
  service: T
) {
  return {
    ...service,
    amount: service.amount ? Number(service.amount) : null,
    daysUntilExpiration: daysUntil(service.expiresAt),
    status: getStatus(service)
  };
}

function buildRenewalData(data: Partial<RenewalServiceInput>) {
  return {
    name: data.name,
    type: data.type,
    provider: data.provider,
    description: data.description,
    renewalUrl: data.renewalUrl,
    amount: data.amount === undefined ? undefined : new Prisma.Decimal(data.amount),
    currency: data.currency,
    renewalInterval: data.renewalInterval,
    expiresAt: data.expiresAt,
    notifyDaysBefore: data.notifyDaysBefore,
    notes: data.notes,
    isActive: data.isActive,
    accessItemId: data.accessItemId
  };
}

function assertCanManage(user: Express.User) {
  if (user.role === UserRole.RESTRICTED) {
    throw new AppError(403, "Restricted users cannot manage renewal services");
  }
}

export async function createRenewalService(data: RenewalServiceInput, user: Express.User, ipAddress?: string) {
  assertCanManage(user);

  const service = await prisma.renewalService.create({
    data: {
      ...buildRenewalData(data),
      createdById: user.id
    } as Prisma.RenewalServiceUncheckedCreateInput
  });

  await createAuditLog({
    userId: user.id,
    action: "RENEWAL_SERVICE_CREATED",
    accessItemId: data.accessItemId,
    ipAddress
  });

  return serializeRenewalService(service);
}

export async function listRenewalServices(query: RenewalServiceQuery, user: Express.User) {
  const andFilters: Prisma.RenewalServiceWhereInput[] = [];

  if (query.type) {
    andFilters.push({ type: query.type });
  }

  if (query.search) {
    andFilters.push({
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { provider: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } }
      ]
    });
  }

  if (user.role !== UserRole.ADMIN) {
    andFilters.push({ createdById: user.id });
  }

  const where: Prisma.RenewalServiceWhereInput = andFilters.length > 0 ? { AND: andFilters } : {};
  const skip = (query.page - 1) * query.limit;

  const items = await prisma.renewalService.findMany({
    where,
    orderBy: { expiresAt: "asc" },
    include: {
      accessItem: {
        select: {
          id: true,
          title: true,
          type: true,
          loginUrl: true
        }
      }
    }
  });

  const serializedItems = items.map(serializeRenewalService);
  const filteredItems = query.status
    ? serializedItems.filter((item) => item.status === query.status)
    : serializedItems;
  const paginatedItems = filteredItems.slice(skip, skip + query.limit);

  return {
    items: paginatedItems,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: filteredItems.length,
      pages: Math.ceil(filteredItems.length / query.limit)
    }
  };
}

export async function listUpcomingRenewalServices(user: Express.User) {
  const result = await listRenewalServices(
    {
      status: "expiring",
      page: 1,
      limit: 10
    },
    user
  );

  return result.items;
}

async function findRenewalService(id: string) {
  return prisma.renewalService.findUnique({
    where: { id },
    include: {
      accessItem: {
        select: {
          id: true,
          title: true,
          type: true,
          loginUrl: true
        }
      }
    }
  });
}

export async function getRenewalService(id: string, user: Express.User) {
  const service = await findRenewalService(id);

  if (!service) {
    throw new AppError(404, "Renewal service not found");
  }

  if (user.role !== UserRole.ADMIN && service.createdById !== user.id) {
    throw new AppError(403, "Access denied");
  }

  return serializeRenewalService(service);
}

export async function updateRenewalService(
  id: string,
  data: Partial<RenewalServiceInput>,
  user: Express.User,
  ipAddress?: string
) {
  assertCanManage(user);
  await getRenewalService(id, user);

  const service = await prisma.renewalService.update({
    where: { id },
    data: buildRenewalData(data)
  });

  await createAuditLog({
    userId: user.id,
    action: "RENEWAL_SERVICE_UPDATED",
    accessItemId: data.accessItemId,
    ipAddress
  });

  return serializeRenewalService(service);
}

export async function deleteRenewalService(id: string, user: Express.User, ipAddress?: string) {
  assertCanManage(user);
  const service = await getRenewalService(id, user);

  await prisma.renewalService.delete({
    where: { id }
  });

  await createAuditLog({
    userId: user.id,
    action: "RENEWAL_SERVICE_DELETED",
    accessItemId: service.accessItemId ?? undefined,
    ipAddress
  });
}
