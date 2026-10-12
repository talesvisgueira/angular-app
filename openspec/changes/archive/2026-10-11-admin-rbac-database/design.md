# Design

## Context

O backend atual (`apps/backend/src`) é mínimo: `server.ts` com Fastify + CORS + rota de auth demo, sem qualquer persistência. O monorepo usa ESM (`module: NodeNext`), TypeScript ~6.0, pnpm workspaces e `pnpm -r build` em ordem topológica. O documento `docs/prompts/arquitetura-db-admin.md` define os domínios RBAC multi-tenant e exige `synchronize: false` com migrations explícitas. Ver proposal.md para motivação e spec delta para o contrato de comportamento.

## Goals / Non-Goals

**Goals:**

- Configurar TypeORM com SQLite no backend, inicializado no bootstrap do servidor.
- Modelar as 9 entidades dos domínios RBAC conforme o documento de arquitetura.
- Migration inicial única criando todo o esquema (tabelas, FKs, índices, auditoria).
- Bootstrap falha (processo encerra) se migrations não aplicarem.

**Non-Goals:**

- Endpoints/repositórios/serviços administrativos (CRUD de pessoas, perfis etc.) — fase seguinte.
- Frontend, seed de dados, autenticação real contra o banco.
- Dialeto de produção (Postgres etc.) — SQLite apenas, mas sem acoplamento que impeça troca futura.

## Decisions

### D1: Driver `better-sqlite3` em vez de `sqlite3`

`better-sqlite3` é síncrono, mais rápido no TypeORM e o driver recomendado hoje; `sqlite3` é legado e mais lento. Ambos exigem build nativo — `better-sqlite3` precisa entrar em `allowBuilds` no `pnpm-workspace.yaml` (pnpm 12 bloqueia postinstall).

### D2: Estrutura em `src/database/` e `src/entities/`

- `src/entities/` — uma classe por entidade, colunas exatas do documento.
- `src/database/data-source.ts` — `DataSource` exportada (usada pelo app e pelo CLI de migrations), lendo path do banco de `DB_PATH` (default `data/app.sqlite`).
- `src/database/migrations/` — migrations versionadas, nomeadas `<Timestamp>InitRbacSchema.ts`.
- `src/database/data-source-cli.ts` — `DataSource` com `migrationsRun: false` + CLI flags para `typeorm migration:run`.

Alternativa considerada: pastas por domínio (`src/modules/person/...`). Rejeitada por enquanto — sem serviços, agrupamento por domínio só adicionaria indireção.

### D3: Generalização Pessoa→Organização por FK própria

`Organization` tem `id` UUID próprio e FK `person_id` → `person` (1:1), além de `endereco`/`bairro`. Alternativa herança de colunas (tabela única) foi rejeitada: o documento trata Organization como entidade distinta e o tenant raiz é sempre `Person`.

### D4: `organization_id` nas tabelas dependentes + índice

Tabelas `user`, `organization_user`, `profile`, `module`, `module_rule`, `profile_rule`, `organization_user_profile` recebem coluna `organization_id` (varchar(36), not null) indexada, com FK → `organization.id`. Como `Organization` é 1:1 com `Person` via `person_id`, cada organização identifica exatamente um tenant; a `organization` em si é ligada ao tenant raiz por `person_id` (1:1) e não carrega `organization_id`. Ajuste feito durante a implementação (antes: FK direta → `person.id`, o que forçava nomes redundantes como `organization_id_ref` na pivot).

### D5: Auditoria como colunas comuns (`user_created`, `data_create`)

Colunas declaradas explicitamente em cada entidade (não decorators globais como `@CreateDateColumn`), pois o documento fixa os nomes `user_created`/`data_create` e `data_create` é varchar/ISO string gravado na criação. Simples e previsível para migration.

### D6: UUID gerado na aplicação

`id` é `varchar(36)` preenchido via `@PrimaryColumn` com `uuid v4` na entidade (ou `@PrimaryGeneratedColumn('uuid')` mapeado para varchar), respeitando o contrato do documento sem depender de `sqlite` gerar UUID.

### D7: ESM/NodeNext

Imports relativos internos usam extensão `.js` (padrão já adotado em `src/routes/auth.js`).

## Risks / Trade-offs

- [Build nativo do `better-sqlite3` bloqueado pelo pnpm 12] → adicionar `better-sqlite3` a `allowBuilds:` em `pnpm-workspace.yaml` e rodar `pnpm install` novamente; documentado nas tasks.
- [SQLite não valida tamanho de varchar nem tipos estritos] → tamanhos ficam declarados nas entidades/migrations (contrato) e serão reforçados por validação na camada de aplicação quando os endpoints existirem.
- [Chaves varchar(36) são menos densas que inteiros] → aceito: exigência do modelo multi-tenant com UUID; índices em `organization_id` e FKs mitigam consultas.
- [`data_create` gravado pela aplicação pode divergir de relógios] → escopo atual aceita timestamp do app; mitigação futura: utilitário central de datas.
- [TypeORM decorators exigem `experimentalDecorators`/`emitDecoratorMetadata`] → verificar/ajustar `tsconfig.json` do backend e rodar `pnpm typecheck` como gate.

## Migration Plan

1. Instalar dependências; habilitar build do driver nativo.
2. Criar entidades + `DataSource` + migration inicial.
3. `migration:run` gera o arquivo SQLite local (`apps/backend/data/` adicionado ao `.gitignore`).
4. Rollback: `migration:revert` (migration única, revert derruba todas as tabelas); banco é descartável em dev.

## Open Questions

- Nenhum que bloqueie specs/approach/tasks. (Nome real das colunas de FK e ordem exata de criação ficam definidos na implementação seguindo D3/D4.)
