# Monorepo Angular + Fastify

Monorepo gerenciado com **pnpm workspaces**. Contém o frontend Angular (com formulário de login) e um backend Node (Fastify) que expõe a API de autenticação.

## Estrutura

```
.
├── apps/
│   ├── frontend/          # Angular 22 standalone (signals, SCSS)
│   └── backend/           # API Node + Fastify + TypeScript
├── packages/
│   └── shared/            # Tipos/DTOs compartilhados (@monorepo/shared)
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

Pacotes do workspace:

- `@monorepo/frontend` — app Angular, serve em `http://localhost:4200`
- `@monorepo/backend` — API Fastify, serve em `http://localhost:3000`
- `@monorepo/shared` — tipos `LoginRequest`, `LoginResponse`, `User`, `ApiError` e validação `isLoginRequest`

## Requisitos

- Node.js >= 22
- pnpm 12 (via `corepack enable`)

## Instalação

```bash
corepack enable
pnpm install
```

## Desenvolvimento

Sobe backend (`:3000`) e frontend (`:4200`) juntos, após buildar o pacote `shared`:

```bash
pnpm dev
```

Ou individualmente:

```bash
pnpm dev:backend
pnpm dev:frontend
```

O dev server do Angular faz proxy de `/api` para `http://localhost:3000` (`apps/frontend/proxy.conf.json`).

### Credenciais de teste

A API aceita qualquer e-mail válido com a senha `password123`.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@exemplo.com","password":"password123"}'
```

## Build

```bash
pnpm build          # todos os pacotes na ordem topológica (shared -> apps)
```

## Testes

```bash
pnpm test           # Vitest no frontend (jsdom)
```

## Formatação

```bash
pnpm format         # prettier --write .
```

## API

| Método | Rota              | Descrição                           |
| ------ | ----------------- | ----------------------------------- |
| GET    | `/health`         | Health check                        |
| POST   | `/api/auth/login` | Autentica e retorna `LoginResponse` |
