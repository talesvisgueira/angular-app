# Tasks

## 1. Domínio geográfico (country / country_state)

- [x] 1.1 Criar `apps/backend/src/entities/country.entity.ts` (`id` varchar(36) PK, `sigla` único not null, `nome` not null, auditoria) seguindo o padrão de `person.entity.ts`; verificar que `pnpm --filter @monorepo/backend exec tsc --noEmit` compila
- [x] 1.2 Criar `apps/backend/src/entities/country-state.entity.ts` (`id` PK, `countryId` FK ManyToOne → `Country`, `sigla`, `nome`, auditoria) e registrar ambas em `ENTITIES` em `data-source.ts`; verificar compilação via `pnpm typecheck`
- [x] 1.3 Estender `entities.spec.ts` (ou criar spec própria) cobrindo auditoria e unicidade de `sigla` de país; rodar `pnpm --filter @monorepo/backend test` e confirmar sucesso

## 2. organization_module e campos de organization

- [x] 2.1 Criar `apps/backend/src/entities/organization-module.entity.ts` (`id` PK, `organizationId` FK, `moduleId` FK → `Module`, `active` not null, auditoria) e registrar em `ENTITIES`; verificar via `pnpm typecheck`
- [x] 2.2 Atualizar `organization.entity.ts`: remover `personId`, trocar relacionamento para identidade herdada de `Person` (FK sobre `id`), e adicionar `countrystateId` (nullable), `telefone` (varchar(13) nullable) e `parentId` (nullable, ManyToOne auto-relacionado); remover referências residuais a `personId` (grep em backend/shared) e verificar via `pnpm typecheck`
- [x] 2.3 Atualizar `user.entity.ts`: remover `personId` e trocar relacionamento para FK sobre `id` → `Person`; atualizar usos existentes (ex.: `routes/auth.ts`) e verificar via `pnpm typecheck` + `pnpm build`

## 3. Migration

- [x] 3.1 Criar migration `apps/backend/src/database/migrations/<timestamp>-AddAdminGeographyAndIdentityRefactor.ts` implementando o `up` conforme design (criar `country`, `country_state`, `organization_module`; `addColumn` de `countrystate_id`/`telefone`/`parent_id`; recriar `user` e `organization` com FK de `id` → `person.id` copiando dados `id = person_id`; dropar `person_id` e FKs antigas) e registrá-la em `MIGRATIONS`; verificar rodando `pnpm dev:backend` e conferindo no log a execução da migration sem erro
- [x] 3.2 Implementar `down` simétrico (recria `person_id` a partir de `id`, restaura FKs antigas, dropa tabelas/colunas novas) e verificar executando `migrations revert` no data-source CLI contra um banco temporário
- [x] 3.3 Conferir a tabela recriada contra `InitRbacSchema` para garantir que índices (`idx_user_organization_id`) e FKs (`fk_user_organization_id`) foram preservados; verificar via inspeção do esquema SQLite (`.schema`) após o `up`

## 4. Verificação de integração

- [x] 4.1 Confirmar que `organization_user.organization_id` (item 8 do pedido) já existe com FK correta — nenhuma alteração; verificar via leitura de `organization-user.entity.ts` e `.schema`
- [x] 4.2 Testar violações de FK de ponta a ponta (organização sem `Person` de `id` correspondente, `country_state` sem país, `organization_module` com módulo inexistente, `parent_id` inexistente) e confirmar que a persistência falha; verificar rodando script/espec contra banco migrado
- [x] 4.3 Rodar `pnpm build` e `pnpm typecheck` na raiz e confirmar sucesso; documentar o impacto na ativação de módulo (condição de negócio futura para regras de acesso) em comentário/nota do change

**Nota — impacto na ativação de módulo:** com a tabela `organization_module` (`organization_id` FK → `organization.id`, `module_id` FK → `module.id`, `active` not null), a ativação de módulos passa a ser uma condição de negócio por organização. As regras de acesso existentes (`profile_rule`, `module_rule`) **não foram alteradas** nesta mudança (fora de escopo, ver Design → Non-Goals): a verificação de acesso a módulos ainda não consulta `organization_module`. Mudanças futuras de regras de negócio SHOULD tratar `organization_module.active = true` (vínculo existente para a organização do usuário) como pré-condição para conceder acesso a um módulo, combinada com as regras de perfil já vigentes.
