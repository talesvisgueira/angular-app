# Design

## Context

O backend (`apps/backend`) usa TypeORM sobre `better-sqlite3` com `synchronize: false` e `migrationsRun: true` (`src/database/data-source.ts:44`). O esquema nasce da migration `1700000000000-InitRbacSchema`; entidades e migration são mantidas em par manualmente. Toda tabela já carrega as colunas de auditoria `user_created` varchar(36) e `data_create` varchar(32) (ISO string via `@BeforeInsert`), e as PKs são UUID varchar(36) geradas pela aplicação. Ver proposta (Why) para a motivação.

## Goals / Non-Goals

**Goals:**

- Adotar herança de identidade: `user.id` e `organization.id` passam a ser FK de `person.id`, eliminando `person_id`.
- Adicionar o domínio geográfico (`country`, `country_state`) e sua ligação com `organization`.
- Adicionar hierarquia de organizações (`parent_id`) e o vínculo organização ↔ módulo (`organization_module`).
- Materializar tudo em uma única migration versionada, sem sincronização automática.

**Non-Goals:**

- Novos endpoints HTTP ou alteração em `src/routes/` (rotas de administração virão em mudanças futuras).
- Alterar regras de negócio de Perfil/Regras (`profile_rule`, `module_rule`): o impacto da ativação de módulo por organização será apenas registrado/verificado nas tarefas.
- Mudanças no frontend ou em `packages/shared`.
- Estratégia de geração de UUID no banco (continua sendo responsabilidade da aplicação).

## Decisions

1. **Migration única aditiva destrutiva**: uma migration `AddAdminGeographyAndIdentityRefactor` executa, em ordem segura para SQLite: criação de `country` e `country_state`; criação de `organization_module`; adição das colunas `countrystate_id`, `telefone`, `parent_id` em `organization`; migração de dados (`user.person_id → user.id`, `organization.person_id → organization.id`); drop das FKs antigas (`fk_user_person_id`, `fk_organization_person_id`) e das colunas `person_id`; criação das novas FKs de `id` → `person.id` e das demais FKs/índices.
   - _Alternativa considerada_: múltiplas migrations (uma por tema). Rejeitada: o refator de identidade só é consistente quando completo; uma única unidade transacional evita estados intermediários inválidos.
2. **Padrão de herança de identidade (`id` = FK para `person.id`)** em vez de manter `person_id` com `UNIQUE`:
   - _Alternativa considerada_: manter `person_id` único. Rejeitada: o pedido explícito do domínio é eliminar a coluna e derivar a identidade de `Person`; com FK em `id` o modelo garante 1:1 por construção.
3. **`down` da migration**: recria `person_id` a partir de `id` (os valores coincidem após o `up`), restaura FKs antigas e dropa as tabelas/colunas novas — rollback completo e simétrico.
4. **SQLite + FK em PK existente**: SQLite não suporta `ALTER TABLE ADD CONSTRAINT`; a FK de `user.id`/`organization.id` → `person.id` exige recriar a tabela dentro da migration (criar tabela nova com o formato final, copiar dados, dropar a antiga, renomear). `countrystate_id`/`telefone`/`parent_id` podem ser adicionados por `addColumn` antes da recriação.
5. **Convenções mantidas**: PKs varchar(36) UUID; auditoria `user_created`/`data_create` varchar(32) ISO string (o item "typestamp" do pedido é atendido pelo timestamp ISO já padronizado no projeto, evitando divergência de tipo); nomenclatura de FKs/índices `fk_<tabela>_<coluna>` / `idx_<tabela>_<coluna>`.
6. **Entidades em par com a migration**: novas entidades `country.entity.ts`, `country-state.entity.ts`, `organization-module.entity.ts` (segundo o padrão `organization-user.entity.ts`); `user.entity.ts` e `organization.entity.ts` perdem `personId` e passam a usar `@OneToOne(() => Person, { primary: true })` / `@JoinColumn` sobre `id`. `ENTITIES` e `MIGRATIONS` em `data-source.ts` são atualizados no mesmo commit.
7. **Item 8 (organization_user.organization_id)**: já implementado no esquema atual; nenhuma alteração de código — apenas verificação nas tarefas.

## Risks / Trade-offs

- [Recriação de `user`/`organization` na migration perde constraints/índices esquecidos] → A recriação copia explicitamente todas as constraints da definição atual; tarefas incluem conferência contra `InitRbacSchema`.
- [Dados legados com `person_id` divergente de `id`] → A migração de dados assume `id = person_id`; pré-validar a consistência na execução e documentar que o modelo antigo sempre criava os registros em par.
- [FK auto-relacionada em SQLite sem enforcement se `PRAGMA foreign_keys` não ativo] → `better-sqlite3` com TypeORM habilita FKs por padrão; validar com teste de violação de FK.
- [Drop de colunas é **BREAKING** para qualquer código que leia `personId`] → Grep por `personId` em backend/shared antes de remover; DTOs atuais não expõem o campo.
- [Ativação de módulo sem integração nas regras de acesso] → Fora de escopo aqui; risco registrado como pergunta aberta para a mudança seguinte de regras de negócio.

## Open Questions

- `sigla` de país/estado: tamanho exato (ex.: varchar(2) ISO vs. varchar(10) flexível) será definido na implementação seguindo o padrão `person.codigo` (varchar(15), único).
