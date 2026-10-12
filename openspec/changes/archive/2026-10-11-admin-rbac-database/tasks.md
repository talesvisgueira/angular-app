# Tasks

## 1. Infraestrutura de dependências e build

- [x] 1.1 Adicionar `typeorm`, `better-sqlite3`, `reflect-metadata` (e `@types/better-sqlite3` em dev) ao `apps/backend/package.json`; incluir `better-sqlite3` em `allowBuilds:` no `pnpm-workspace.yaml`; verificar com `pnpm install` seguido de `node -e "require('better-sqlite3')"` resolvendo sem erro
- [x] 1.2 Ajustar `apps/backend/tsconfig.json` com `experimentalDecorators` e `emitDecoratorMetadata`; verificar com `pnpm --filter @monorepo/backend typecheck`
- [x] 1.3 Adicionar scripts `migration:run` e `migration:revert` (via `typeorm-ts-node-esm`/tsx CLI apontando para `data-source-cli.ts`) ao `apps/backend/package.json`; adicionar `apps/backend/data/` ao `.gitignore`; verificar com `pnpm --filter @monorepo/backend exec npm run migration:run --if-present` sem falha de comando não encontrado

## 2. Entidades dos domínios RBAC

- [x] 2.1 Criar `src/entities/person.entity.ts` com colunas do contrato (`id` varchar(36) PK, `codigo` 15 unique, `name` 150, `short_name` 20 unique, `description` 400 null, `email` 100 unique, `user_created`, `data_create`) e verificar com `pnpm --filter @monorepo/backend typecheck`
- [x] 2.2 Criar `src/entities/organization.entity.ts` (FK `person_id` 1:1 → person, `endereco` 100, `bairro` 80, auditoria, `organization_id`) e verificar com `pnpm --filter @monorepo/backend typecheck`
- [x] 2.3 Criar `src/entities/user.entity.ts` (FK `person_id` not null, credenciais de autenticação, auditoria, `organization_id`) e verificar com `pnpm --filter @monorepo/backend typecheck`
- [x] 2.4 Criar `src/entities/profile.entity.ts`, `module.entity.ts` e `module-rule.entity.ts` (regra vinculada a `module_id`, auditoria, `organization_id`) e verificar com `pnpm --filter @monorepo/backend typecheck`
- [x] 2.5 Criar as relações pivot `src/entities/profile-rule.entity.ts`, `organization-user.entity.ts` e `organization-user-profile.entity.ts` com FKs para as entidades correspondentes, auditoria e `organization_id` indexado, e verificar com `pnpm --filter @monorepo/backend typecheck`
- [x] 2.6 Escrever teste unitário (Vitest, mesmo padrão dos specs do frontend, executável via `pnpm --filter @monorepo/backend test` ou script equivalente no backend) validando metadata do TypeORM: nomes de tabelas, colunas esperadas e unicidade declarada das entidades

## 3. DataSource e migration inicial

- [x] 3.1 Criar `src/database/data-source.ts` com `DataSource` SQLite (`synchronize: false`, `migrationsRun: true`, path via `DB_PATH` com default `data/app.sqlite`, entidades e migrations registradas) e verificar com `pnpm --filter @monorepo/backend typecheck`
- [x] 3.2 Criar `src/database/data-source-cli.ts` para o CLI de migrations e verificar que `migration:run` executa apontando para ele
- [x] 3.3 Gerar/criar `src/database/migrations/<Timestamp>InitRbacSchema.ts` criando as 9 tabelas com PKs varchar(36), FKs, índices (`organization_id` e campos únicos) e colunas `user_created`/`data_create`; verificar com `migration:run` criando o arquivo SQLite e conferindo as tabelas via `sqlite3 data/app.sqlite ".tables"`
- [x] 3.4 Verificar rollback com `migration:revert` removendo as tabelas e reexecutar `migration:run`

## 4. Integração no bootstrap do servidor

- [x] 4.1 Inicializar a `DataSource` em `src/server.ts` antes de `app.listen`, com tratamento centralizado de erro (log + `process.exit(1)` se migrations falharem); verificar com `pnpm dev:backend` e `curl localhost:3000/health` retornando `{ "status": "ok" }` com banco criado
- [x] 4.2 Simular falha (ex.: `DB_PATH` apontando para diretório inválido) e verificar que o processo encerra com erro logado, sem subir o servidor

## 5. Verificação final

- [x] 5.1 Rodar `pnpm build` e `pnpm typecheck` na raiz e confirmar que nenhum pacote quebra (shared → backend em ordem topológica)
- [x] 5.2 Rodar `pnpm dev` na raiz e confirmar que backend (:3000) sobe com banco migrado e health responde

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result.
