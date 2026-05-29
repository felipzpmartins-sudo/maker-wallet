import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "./client";

async function main() {
  const email = "admin@maker.com";
  const passwordHash = await bcrypt.hash("Admin@123456", 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      totalAccess: true,
      canManagePermissions: true
    },
    create: {
      name: "Maker Admin",
      email,
      passwordHash,
      role: UserRole.ADMIN,
      totalAccess: true,
      canManagePermissions: true
    }
  });

  const departments = [
    ["financeiro", "Financeiro", "financeiro", "Contas bancarias, ERPs e sistemas fiscais"],
    ["marketing", "Marketing", "marketing", "Redes sociais, trafego pago e ferramentas criativas"],
    ["video", "Video", "video", "Streaming, edicao e bancos de midia"],
    ["expansao", "Expansao", "expansao", "Contas estrategicas e plataformas de crescimento"],
    ["suporte", "Suporte", "suporte", "Atendimento, help desk e canais de relacionamento"],
    ["ecommerce", "E-commerce", "ecommerce", "Marketplaces, lojas virtuais e pagamentos"],
    ["wifi", "Wi-Fi", "wifi", "Redes internas, roteadores e acessos de convidados"],
    ["outros", "Outros", "outros", "Acessos que nao se encaixam nos demais setores"]
  ] as const;

  await Promise.all(
    departments.map(([id, name, iconKey, description]) =>
      prisma.department.upsert({
        where: { id },
        update: {},
        create: { id, name, iconKey, description }
      })
    )
  );

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
