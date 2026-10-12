# Proposal

## Why

A base administrativa atual não modela localização (país/estado), não permite hierarquia entre organizações nem ativação de módulos por organização. Além disso, `user` e `organization` referenciam `Person` por uma coluna `person_id` separada, quando o domínio já trata `Person` como raiz de identidade — o que permite simplificar o modelo fazendo `id` de `user`/`organization` ser, ele próprio, chave estrangeira de `person.id` (padrão de herança de identidade).

## What Changes

- **BREAKING** — `user`: remoção da coluna `person_id` e criação de FK de `user.id` → `person.id` (o usuário passa a compartilhar o identificador da sua pessoa).
- **BREAKING** — `organization`: remoção da coluna `person_id` e criação de FK de `organization.id` → `person.id`.
- Nova tabela `country` (`id` UUID, `sigla`, `nome`) com colunas de auditoria.
- Nova tabela `country_state` (`id` UUID, `country_id` FK → `country`, `sigla`, `nome`) com colunas de auditoria.
- `organization`: novo campo `countrystate_id` (nullable) com FK → `country_state`.
- `organization`: novo campo `telefone` varchar(13) nullable.
- `organization`: novo campo `parent_id` varchar(36) nullable com FK auto-relacionada → `organization.id` (hierarquia de organizações).
- Nova tabela `organization_module` (`id` UUID, `organization_id` FK → `organization`, `module_id` FK → `module`, `active`) com colunas de auditoria.
- Tudo materializado por nova migration TypeORM (`synchronize: false`); entidades atualizadas em par com a migration.

**Observação sobre item 8 do pedido original**: `organization_user.organization_id` com FK para `organization` **já existe** no esquema atual (entidade `organization-user.entity.ts:18` e migration inicial). Nenhuma alteração é necessária; as tarefas incluem apenas verificação.

## Capabilities

### New Capabilities

(nenhuma — todas as alterações pertencem à capacidade existente `rbac-data-model`, que já define o contrato do modelo de dados multi-tenant)

### Modified Capabilities

- `rbac-data-model`: identidade de `User` e `Organization` passa a ser herdada de `Person` (FK em `id`, remoção de `person_id`); novas tabelas `country`, `country_state` e `organization_module`; `Organization` ganha localização (`countrystate_id`), `telefone` e hierarquia (`parent_id` auto-relacionado).

## Impact

- **Código**: `apps/backend/src/entities/` (user, organization, novos country/country-state/organization-module), `apps/backend/src/database/data-source.ts` (registro de entidades e migrations), nova migration em `apps/backend/src/database/migrations/`.
- **Banco**: nova migration **BREAKING** (drop de colunas `person_id` em `user` e `organization`; dados existentes nessas colunas migram para o padrão `id = person_id`).
- **Dependências**: nenhuma nova dependência de pacote.
- **Frontend/shared**: sem impacto direto nesta mudança (DTOs não expõem `person_id`).
- **Regras de negócio de acesso (Perfil/Regras)**: `organization_module` torna a ativação de módulo por organização uma condição de negócio para o acesso a módulos; a verificação desse impacto está contemplada nas tarefas.
