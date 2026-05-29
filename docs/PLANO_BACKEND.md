# Plano de Acao - Backend Maker Wallet

## Objetivo

Criar uma API segura para o Maker Wallet, capaz de armazenar acessos, senhas, contas, SSH, FTP, plataformas, e-mails e arquivos Keystore da empresa Maker.

## Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT
- bcrypt
- Criptografia AES para senhas armazenadas
- Multer para upload de Keystore
- Zod para validacao
- Helmet, CORS e rate limit

## Estrutura

```txt
src/
  config/
  controllers/
  middlewares/
  prisma/
  routes/
  services/
  types/
  uploads/
  utils/
```

## Ordem de execucao

1. Setup do projeto Node.js + TypeScript.
2. Configurar Express, Helmet, CORS, JSON e handler de erros.
3. Configurar Prisma e modelar o banco PostgreSQL.
4. Criar autenticacao com JWT e bcrypt.
5. Criar CRUD de usuarios, restrito para ADMIN.
6. Criar CRUD de acessos.
7. Criptografar senhas dos acessos com AES.
8. Adicionar filtros e paginacao no endpoint de acessos.
9. Criar permissoes por usuario e item.
10. Criar upload/download protegido de arquivos Keystore.
11. Criar logs de auditoria.
12. Validar fluxos principais do MVP.

## Modelos principais

### User

- id
- name
- email
- passwordHash
- role: ADMIN, USER, RESTRICTED
- createdAt
- updatedAt

### AccessItem

- id
- type: SSH, FTP, EMAIL, PLATFORM, KEYSTORE
- title
- description
- host
- port
- username
- email
- encryptedPassword
- loginUrl
- observation
- appName
- keystoreFilePath
- createdById
- createdAt
- updatedAt

### AccessPermission

- id
- userId
- accessItemId
- canView
- canEdit
- canDelete

### AuditLog

- id
- userId
- action
- accessItemId
- ipAddress
- createdAt

## Regras de seguranca

- Nunca salvar senha pura no banco.
- Nunca retornar `passwordHash` ou `encryptedPassword`.
- Revelar senha somente no endpoint especifico.
- Registrar log quando uma senha for revelada.
- Proteger upload e download de Keystore com autenticacao e permissao.
- Limitar tamanho e tipos de arquivo no upload.
- Aplicar rate limit no login.
- Validar entradas com Zod.
- Usar variaveis sensiveis apenas via `.env`.

## Endpoints do MVP

### Auth

- `POST /auth/login`
- `GET /auth/me`

### Users

- `POST /users`
- `GET /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `DELETE /users/:id`

### Access

- `POST /access`
- `GET /access`
- `GET /access/:id`
- `PATCH /access/:id`
- `DELETE /access/:id`
- `POST /access/:id/reveal-password`
- `POST /access/:id/copy-log`
- `POST /access/:id/permissions`

### Upload

- `POST /upload/keystore`
- `GET /upload/keystore/:id/download`

## Variaveis de ambiente

```env
DATABASE_URL=
JWT_SECRET=
ENCRYPTION_SECRET=
PORT=3333
FRONTEND_URL=http://localhost:3000
```

## Criterio de pronto do primeiro MVP

- API sobe localmente.
- Prisma schema compila.
- Login retorna JWT.
- Usuario autenticado consegue consultar `/auth/me`.
- ADMIN gerencia usuarios.
- Acessos sao criados com senha criptografada.
- Listagens nao retornam senha criptografada.
- Senha so aparece em `/access/:id/reveal-password`.
- Permissoes controlam visualizacao, edicao e exclusao.
- Keystore nao fica publico sem autenticacao.
- Auditoria registra acoes sensiveis.
