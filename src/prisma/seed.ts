import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "./client";

async function main() {
  const email = "admin@maker.com";
  const passwordHash = await bcrypt.hash("Admin@123456", 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Maker Admin",
      email,
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  console.log("Seed completed. Default admin ensured.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
