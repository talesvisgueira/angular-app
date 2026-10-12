# Tasks

## 1. Migration e auditoria timestamp

- [x] 1.1 Criar migration `apps/backend/src/database/migrations/<timestamp>-AddCrudApiFoundation.ts` fase 1: recriar as 12 tabelas trocando `data_create` varchar(32) por `data_created` timestamp not null + `data_updated` timestamp not null (copiando dados e todas as FKs/índices vigentes); implementar `down` simétrico (restaura `data_create`); registrar em `MIGRATIONS` em `data-source.ts`; verificar rodando `pnpm dev:backend` e conferindo no log a execução sem erro
- [x] 1.2 Atualizar as 12 entidades em `apps/backend/src/entities/`: substituir `dataCreate` por `dataCreated`/`dataUpdated` (timestamp), `@BeforeInsert` preenche ambas, `@BeforeUpdate` renova `dataUpdated`; atualizar usos (specs de entidades, migrations.spec); verificar via `pnpm --filter @monorepo/backend exec tsc --noEmit`
- [x] 1.3 Criar migration fase 2 no mesmo arquivo: recriar `user` sem `organization_id`, sem `idx_user_organization_id` e sem `fk_user_organization_id` (copiando colunas restantes); `down` recria o vínculo a partir de `organization_user`; verificar via `.schema` que `user` não tem mais `organization_id` e que FKs/índices das demais tabelas foram preservados
- [x] 1.4 Atualizar/estender specs de banco (`migrations.spec.ts`/`entities.spec.ts`) cobrindo auditoria `data_created`/`data_updated` (criação e atualização) e ausência de `organization_id` em `user`; rodar `pnpm --filter @monorepo/backend test` e confirmar sucesso

## 2. Infraestrutura de API

- [x] 2.1 Adicionar dependências `@fastify/swagger` e `@fastify/swagger-ui` ao `apps/backend/package.json` (via pnpm); registrar em `server.ts` com OpenAPI 3 (modo dynamic), JSON em `/docs/json` e UI em `/docs` cobrindo os endpoints existentes (`/health`, login demo); verificar subindo o backend e acessando `/docs`
- [x] 2.2 Implementar tratamento centralizado de erros: `setErrorHandler` global (validação → 400, não encontrado → 404, violação de FK/unicidade → 409, interno → 500, corpo `{ message }` sem stack) e helper de paginação/validação compartilhado para as rotas; verificar com teste unitário do handler

## 3. Endpoints de CRUD

- [x] 3.1 Implementar CRUD completo (`POST/GET /api/<recurso>`, `GET/PATCH/DELETE /api/<recurso>/:id`) com schemas JSON de body/response e paginação `limit`/`offset` para: `person`, `country`, `country_state`, `profile`, `module` (arquivos `src/routes/<recurso>.ts`); verificar via `pnpm build` + requisições manuais contra o backend
- [x] 3.2 Implementar CRUD para `user` e `organization` (criação exige `id` de `person` existente; `organization` aceita `countrystate_id`/`telefone`/`parent_id`); verificar violações de FK de ponta a ponta (person inexistente → 409)
- [x] 3.3 Implementar CRUD para as relações: `organization_user`, `organization_user_profile`, `organization_module`, `profile_rule`, `module_rule`; verificar unicidade/consistência de vínculos (módulo ou organização inexistente → 409)
- [x] 3.4 Garantir que toda criação/atualização via API preenche auditoria (`user_created` = `'system'`, `data_created`, `data_updated` renovado no PATCH); verificar com teste de integração de um recurso

## 4. Verificação de integração

- [x] 4.1 Verificar itens 2–4 do pedido original já entregues pela change `db-admin-refactor`: `user`/`organization` sem coluna `person_id`, com FKs `fk_user_id`/`fk_organization_id` sobre `id` → `person.id`; verificar via inspeção do `.schema` após o `up` e registrar o resultado na nota de verificação
- [x] 4.2 Rodar `pnpm build` e `pnpm typecheck` na raiz e confirmar sucesso; confirmar que `packages/shared` e `apps/frontend` não foram alterados (git status limpo fora do backend)
- [x] 4.3 Validar o Swagger: `/docs/json` descreve todos os endpoints CRUD, `/health` e login; executar ao menos um ciclo completo (criar → obter → atualizar → remover) pela UI Swagger contra o banco migrado e registrar o resultado

**Notas de verificação:**

- **Itens 2–4 do pedido original (4.1)**: confirmado via inspeção do `.schema` do SQLite após o `up` — `user` e `organization` **não possuem coluna `person_id`** e trazem as FKs `fk_user_id` e `fk_organization_id` (ambas `id` → `person.id`), conforme a herança de identidade materializada pela change `db-admin-refactor`. O item 8 (`organization_user.organization_id` com FK) também confirmado (`fk_organization_user_organization_id`). Nenhuma alteração necessária.
- **Swagger (4.3)**: `/docs/json` serviu OpenAPI 3.0.3 com 26 paths (12 recursos CRUD + login demo + health); UI carregada em `/docs` (HTTP 200). Ciclo completo executado contra o banco migrado (`POST` country 201 → `GET /:id` 200 → `PATCH /:id` 200 renovando `data_updated` → `DELETE /:id` 204 → `GET /:id` 404), mais 409 para FK/unicidade (estado sem país, sigla duplicada, person inexistente em user/organization/module/profile_rule) e 400 para corpo inválido. Ciclo equivalente coberto por teste de integração (`src/routes/country.spec.ts`).
