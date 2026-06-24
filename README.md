# Maker Wallet

Projeto com backend Express/Prisma e frontend React/TanStack Start para gestao segura de acessos.

## Estrutura

- `src/`: backend da API
- `prisma/`: schema e seed do banco
- `frontend/`: interface web

API segura para armazenar acessos, senhas, contas, SSH, FTP, plataformas, e-mails e arquivos Keystore.

## Requisitos

- Node.js
- PostgreSQL
- npm

## Configuracao

1. Copie `.env.example` para `.env`.
2. Ajuste as variaveis:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/maker_wallet?schema=public"
JWT_SECRET="change-me"
ENCRYPTION_SECRET="change-me-with-32-or-more-characters"
PORT=3333
FRONTEND_URL="http://localhost:3000"
```

## Comandos

### Backend

```bash
npm install
npm run prisma:migrate
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Para trocar o codigo usado no link de cadastro, crie `frontend/.env`:

```env
VITE_REGISTRATION_INVITE_CODE="um-codigo-secreto"
```

O link de cadastro fica disponivel em `Configuracoes > Convite de cadastro` para usuarios admin/CEO.

## Admin inicial

O seed cria um admin para desenvolvimento:

```txt
email: admin@maker.com
senha: Admin@123456
```

Troque essa senha antes de usar em qualquer ambiente real.

## Endpoints principais

- `GET /health`
- `POST /auth/login`
- `POST /auth/change-password`
- `GET /auth/me`
- `POST /users`
- `GET /users`
- `POST /access`
- `GET /access`
- `POST /access/:id/reveal-password`
- `POST /access/:id/permissions`
- `POST /upload/keystore`
- `GET /upload/keystore/:id/download`

## Plano

O plano de execucao do backend esta em `docs/PLANO_BACKEND.md`.
