# Proposal

## Why

O backend não expõe nenhuma API de administração para os dados do modelo RBAC (apenas um login demo sem acesso ao banco), e não há documentação de API. Além disso, a tabela `user` ainda carrega `organization_id` direto — duplicando o vínculo que já existe na pivot `organization_user` — e a auditoria usa `data_create` varchar(32) ISO em vez dos timestamps `data_created`/`data_updated` definidos como alvo no pedido.

## What Changes

- **BREAKING** — `user`: remoção da coluna `organization_id`, do índice `idx_user_organization_id` e da FK `fk_user_organization_id`. O vínculo usuário ↔ organização passa a ser exclusivamente via `organization_user`.
- **BREAKING** — Auditoria em todas as tabelas: `data_create` varchar(32) é convertida em `data_created` timestamp not null (preservando os valores existentes) e nova coluna `data_updated` timestamp not null; `user_created` varchar(36) permanece.
- Novos endpoints de CRUD (criar, listar, obter, atualizar, remover) para as 12 entidades do modelo: `person`, `user`, `organization`, `organization_user`, `organization_user_profile`, `profile`, `module`, `module_rule`, `profile_rule`, `organization_module`, `country`, `country_state`.
- Swagger configurado no backend (`@fastify/swagger` + `@fastify/swagger-ui`) documentando todos os endpoints existentes, incluindo `/health` e o login demo.
- Itens 2–4 do pedido original (remover `person_id` de `organization`; criar FKs de `user`/`organization` para `person`) — **já entregues** pela change `db-admin-refactor` (herança de identidade: `user.id`/`organization.id` são FK de `person.id`, sem coluna `person_id`); esta change apenas verifica e registra a conformidade.

## Capabilities

### New Capabilities

- `admin-crud-api`: API REST de administração — CRUD completo para as entidades do modelo RBAC/geográfico e documentação Swagger dos endpoints.

### Modified Capabilities

- `rbac-data-model`: `User` deixa de ter coluna `organization_id` (vínculo com organização só pela pivot `organization_user`); auditoria de todas as tabelas passa a ser `user_created` varchar(36) + `data_created` timestamp not null + `data_updated` timestamp not null.

## Impact

- **Código**: `apps/backend/src/database/migrations/` (nova migration BREAKING), `apps/backend/src/entities/` (user perde `organizationId`; todas ganham `dataCreated`/`dataUpdated` timestamp), `apps/backend/src/server.ts` (registro do Swagger e das novas rotas), novos arquivos em `apps/backend/src/routes/` (um módulo de rotas por entidade) e `apps/backend/src/plugins/` ou equivalente para Swagger.
- **Banco**: nova migration **BREAKING** (drop de coluna/índice/FK em `user`; conversão de tipo de auditoria nas 12 tabelas).
- **Dependências**: novas dependências no backend — `@fastify/swagger` e `@fastify/swagger-ui`.
- **Frontend/shared**: sem alterações (o prompt veda mudanças no frontend); DTOs de login do shared permanecem intocados.
- **Regras de acesso (Perfil/Regras)**: os endpoints de CRUD são administrativos e abertos nesta fase (sem autenticação/autorização — infraestrutura de auth real não existe no backend); o efeito sobre `profile_rule`/`module_rule` é nenhum — nenhum dado dessas regras muda de formato.
