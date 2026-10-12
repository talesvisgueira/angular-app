# Design

## Context

Backend Fastify + TypeORM sobre `better-sqlite3` com `synchronize: false` e `migrationsRun: true` (`src/database/data-source.ts`). O esquema nasce de duas migrations (`InitRbacSchema`, `AddAdminGeographyAndIdentityRefactor`); entidades e migrations são mantidas em par manualmente. Hoje o backend só registra `@fastify/cors` e `routes/auth.ts` (login demo sem acesso ao banco). Estado atual relevante: `user.id`/`organization.id` já são FK de `person.id` (sem `person_id`); `user` ainda tem `organization_id` + `idx_user_organization_id` + `fk_user_organization_id`; todas as tabelas têm `user_created` varchar(36) e `data_create` varchar(32) ISO preenchido por `@BeforeInsert`.

## Goals / Non-Goals

**Goals:**

- Migrar a auditoria para `data_created`/`data_updated` timestamp em todas as tabelas, preservando dados.
- Remover o vínculo direto `user.organization_id`, consolidando o vínculo na pivot `organization_user`.
- CRUD REST completo para as 12 entidades com tratamento centralizado de erros.
- Swagger (OpenAPI + UI) documentando todos os endpoints.

**Non-Goals:**

- Autenticação/autorização real nos endpoints de CRUD (infraestrutura de auth não existe; login demo permanece).
- Mudanças no frontend ou em `packages/shared`.
- Novos domínios ou alteração nas regras `profile_rule`/`module_rule`.
- Filtros de busca avançados, ordenação customizável ou paginação por cursor.

## Decisions

1. **Migration única `AddCrudApiFoundation`**: executa em duas fases para SQLite. Fase 1 (auditoria): para cada uma das 12 tabelas, recria a tabela com `data_created` timestamp not null e `data_updated` timestamp not null no lugar de `data_create`, copiando dados (`data_created = data_create`, `data_updated = data_create`), dentro de transação com FKs desabilitadas (`PRAGMA foreign_keys = OFF` no CLI TypeORM) para tolerar a ordem de recriação. Fase 2 (`user`): recria a tabela sem `organization_id`, `idx_user_organization_id` e `fk_user_organization_id`, copiando as colunas restantes. `down` simétrico restaura `data_create` (ISO string a partir do timestamp) e recria `user` com o vínculo de organização (assume-se que o vínculo volta a ser derivado do primeiro `organization_user` do usuário — `down` é caminho de recuo, não de reconciliação).
   - _Alternativa considerada_: duas migrations (uma por tema). Rejeitada: mesmo critério da change anterior — o refator só é consistente completo, e uma unidade transacional evita estados intermediários.
2. **Conversão de tipo de auditoria**: `timestamp` no TypeORM/SQLite (armazenado como `datetime`); entidades passam a `@CreateDateColumn`-like manual (o projeto não usa decorators automáticos): `@BeforeInsert` preenche `dataCreated` e `dataUpdated` com `new Date()`, `@BeforeUpdate` renova `dataUpdated`. Códigos existentes que escreviam `dataCreate` são atualizados (specs de entidades e migrations antigas não são reescritas — migrations históricas permanecem imutáveis).
3. **Estrutura de CRUD**: um arquivo de rotas por entidade em `src/routes/<recurso>.ts`, cada um exportando um plugin `FastifyInstance` registrado com prefixo `/api` em `server.ts`; um helper compartilhado (`src/routes/crud-helpers.ts` ou similar) com validação de corpo, paginação e mapeamento de erros. Sem repositório genérico — cada rota usa o `DataSource` disponível via `app.decorate`/módulo (TypeORM repos por `app.getRepository(Entity)`).
4. **Tratamento centralizado de erros**: hook `setErrorHandler` global no Fastify que mapeia `QueryFailedError` (SQLITE_CONSTRAINT → 409; senão 500), erros de validação próprios (400) e `NotFound` (404), sempre `{ message }`, logando detalhes no servidor sem vazar stack no corpo.
5. **Swagger**: `@fastify/swagger` (OpenAPI 3, modo dynamic a partir das rotas) + `@fastify/swagger-ui` em `/docs`, JSON em `/docs/json`; schemas de request/response por rota usando os schemas JSON do Fastify (fonte da documentação e da validação — um só lugar).
6. **Autenticação ausente**: endpoints CRUD são abertos nesta fase; `user_created` recebe valor de sistema (`'system'`) enquanto não há auth real. Risco registrado: quando a autenticação for implementada, os endpoints deverão passar a exigir credenciais e preencher `user_created` com o usuário autenticado.
7. **Itens 2–4 do pedido**: verificação apenas — ler `.schema`/migration e confirmar `fk_user_id`/`fk_organization_id` (`id` → `person.id`) e ausência de `person_id`; nenhuma alteração de código.

## Risks / Trade-offs

- [Recriar 12 tabelas na migration é destrutivo se uma constraint for esquecida] → cada recriação copia explicitamente todas as colunas/FKs/índices das definições vigentes; tarefas incluem conferência `.schema` tabela a tabela.
- [`data_create` varchar(32) → timestamp em dados existentes] → valores são ISO strings parseáveis; conversão direta. Se algum valor não for parseável, a migration falha cedo (transação) em vez de corromper silenciosamente.
- [Remover `user.organization_id` é BREAKING para consumidores que lia o campo] → backend não expõe ainda endpoints que leiam esse campo (auth é demo); pivot `organization_user` cobre o vínculo.
- [CRUD sem auth expõe dados administrativos] → aceito para esta fase (ambiente de desenvolvimento); anotado como pré-requisito da change futura de autenticação.
- [Swagger dynamic sem schemas fica pobre] → rotas CRUD obrigatoriamente declaram `schema` (body/response) no Fastify, que alimenta validação e documentação juntas.

## Open Questions

- Nenhum em aberto para esta mudança; autenticação real nos CRUDs fica registrada para change futura.
