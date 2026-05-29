CREATE TABLE "Department" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "iconKey" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Department" ("id", "name", "iconKey", "description", "updatedAt") VALUES
('financeiro', 'Financeiro', 'financeiro', 'Contas bancarias, ERPs e sistemas fiscais', CURRENT_TIMESTAMP),
('marketing', 'Marketing', 'marketing', 'Redes sociais, trafego pago e ferramentas criativas', CURRENT_TIMESTAMP),
('video', 'Video', 'video', 'Streaming, edicao e bancos de midia', CURRENT_TIMESTAMP),
('expansao', 'Expansao', 'expansao', 'Contas estrategicas e plataformas de crescimento', CURRENT_TIMESTAMP),
('suporte', 'Suporte', 'suporte', 'Atendimento, help desk e canais de relacionamento', CURRENT_TIMESTAMP),
('ecommerce', 'E-commerce', 'ecommerce', 'Marketplaces, lojas virtuais e pagamentos', CURRENT_TIMESTAMP),
('wifi', 'Wi-Fi', 'wifi', 'Redes internas, roteadores e acessos de convidados', CURRENT_TIMESTAMP),
('outros', 'Outros', 'outros', 'Acessos que nao se encaixam nos demais setores', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
