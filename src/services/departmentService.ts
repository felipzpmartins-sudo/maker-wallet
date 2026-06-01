import { prisma } from "../prisma/client";
import { AppError } from "../utils/errors";

export async function listDepartments() {
  return prisma.department.findMany({
    orderBy: { name: "asc" }
  });
}

export async function createDepartment(data: {
  id: string;
  name: string;
  iconKey: string;
  description: string;
}) {
  const existing = await prisma.department.findUnique({ where: { id: data.id } });

  if (existing) {
    throw new AppError(409, "Department already exists");
  }

  return prisma.department.create({ data });
}

export async function updateDepartment(
  id: string,
  data: Partial<{
    name: string;
    iconKey: string;
    description: string;
  }>
) {
  const existing = await prisma.department.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(404, "Department not found");
  }

  return prisma.department.update({
    where: { id },
    data
  });
}

export async function deleteDepartment(id: string) {
  const existing = await prisma.department.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(404, "Department not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.department.delete({ where: { id } });

    const users = await tx.user.findMany({
      where: { allowedDepartments: { has: id } },
      select: { id: true, allowedDepartments: true }
    });

    await Promise.all(
      users.map((user) =>
        tx.user.update({
          where: { id: user.id },
          data: {
            allowedDepartments: user.allowedDepartments.filter((departmentId) => departmentId !== id)
          }
        })
      )
    );
  });
}
