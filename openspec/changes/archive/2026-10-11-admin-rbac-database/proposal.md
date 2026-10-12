# Proposal

## Why

O backend (`@monorepo/backend`) hoje não possui camada de persistência: os dados vivem em memória. Para implementar o módulo administrativo com controle de acesso granular (RBAC) e isolamento multi-tenant, é necessário estabelecer o banco SQLite com TypeORM, entidades e migrations versionadas desde o primeiro dia (`synchronize: false`).

## What Changes

- Introduzir TypeORM + driver SQLite no backend, com configuração de `DataSource` e `synchronize: false` (migrations explícitas obrigatórias).
- Criar entidades TypeORM para os domínios RBAC multi-tenant: `Person` (tenant), `Organization`, `User`, `OrganizationUser`, `Profile`, `Module`, `ModuleRule`, `ProfileRule`, `OrganizationUserProfile`.
- Gerar a migration inicial criando todas as tabelas com: chaves primárias UUID (varchar(36)), colunas de auditoria `user_created`/`data_create` em todas as tabelas e índices em `organization_id` nas tabelas dependentes.
- Registrar a inicialização da `DataSource` no bootstrap do servidor (`src/server.ts`), com falha de startup se migrations não aplicarem.
- Adicionar script de migração (`migration:run`) ao package.json do backend.

## Capabilities

### New Capabilities

- `rbac-data-model`: Modelo de dados multi-tenant do controle de acesso — entidades, colunas, chaves, índices e auditoria dos domínios Pessoa/Organização/Usuário/Perfil/Módulo/Regras, e o contrato de migrations versionadas que materializa esse esquema no SQLite.

### Modified Capabilities

- `monorepo-architecture`: Nenhuma mudança de requisito — a nova dependência do backend (TypeORM) apenas segue as regras existentes de workspace/dependências.

## Impact

- **Código**: `apps/backend/src/` (novos módulos `database/` e `entities/`, alteração em `server.ts`).
- **Dependências**: `typeorm`, driver SQLite (`better-sqlite3`), `reflect-metadata` adicionadas ao `@monorepo/backend`.
- **Configuração**: novo `data-source` config para CLI de migrations; artefato SQLite local (ex.: `apps/backend/data/app.sqlite`) ignorado pelo git.
- **APIs**: sem alteração de endpoints nesta fase — a mudança estabelece a base de persistência para endpoints administrativos futuros.
