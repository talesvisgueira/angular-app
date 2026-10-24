# Tasks

## 1. Fundação: auditoria e infraestrutura de teste

- [x] 1.1 Atualizar `src/routes/crud-helpers.ts` para injetar `userCreated`/`userUpdated` (`SYSTEM_USER`) e `active = true` (quando ausente) na criação, e renovar `dataUpdated`/`userUpdated` no `PATCH`; verificar com teste unitário do helper (`pnpm --filter @monorepo/backend test`)
- [x] 1.2 Extrair helper de teste compartilhado (SQLite temporário + migrations + Fastify com `dataSource` decorado + `registerErrorHandler`) a partir do setup de `src/routes/country.spec.ts`; verificar que os specs existentes ainda executam (`pnpm --filter @monorepo/backend test`)

## 2. Entidades de base renomeadas e novas sem dependências

- [x] 2.1 Atualizar `person.entity.ts`: `codigo` → `code` (varchar(15) único), incluir `active` e `userUpdated`; ajustar `entities.spec.ts` para os novos mapeamentos e rodar os testes
- [x] 2.2 Atualizar `country.entity.ts`: `sigla`(15)/`nome` → `shortName` varchar(2) único/`name` varchar(80), incluir `active`/`userUpdated`; verificar em `entities.spec.ts`
- [x] 2.3 Criar `state.entity.ts` (`@Entity('state')`: `countryId`, `shortName` varchar(2), `name`), remover `country-state.entity.ts` e atualizar importações; verificar em `entities.spec.ts`
- [x] 2.4 Criar `system.entity.ts` e `city.entity.ts` (`stateId`, `shortName` varchar(15), `name`) com auditoria completa; verificar em `entities.spec.ts`

## 3. Entidades dependentes e registro no DataSource

- [x] 3.1 Atualizar `organization.entity.ts`: `endereco`/`bairro`/`countrystate_id`/`telefone` → `address`/`district`/`cityId` (FK `City`)/`zipCode`, mantendo `parentId`; verificar em `entities.spec.ts`
- [x] 3.2 Atualizar `user.entity.ts`: relação por `personId` (`ManyToOne` + `@JoinColumn({ name: 'person_id' })`) e incluir `authenticationMode` default `PASSWORD`; verificar em `entities.spec.ts`
- [x] 3.3 Atualizar `module.entity.ts`: incluir `systemId` (FK `System`) e manter `organizationId`; verificar em `entities.spec.ts`
- [x] 3.4 Remover coluna/relação `organization_id` de `module-rule.entity.ts`, `profile-rule.entity.ts` e `organization-user-profile.entity.ts`; verificar em `entities.spec.ts`
- [x] 3.5 Criar `person-address.entity.ts` (campos `cityId`/`countryId`/`stateId`/`personId` nullable com FKs) e `person-phone.entity.ts` (colunas `numeric` tipadas como `number`), `user-authentication-mode.entity.ts` (`userId`, `userKey` único, `keyValue`) e `module-organization.entity.ts`; verificar em `entities.spec.ts`
- [x] 3.6 Atualizar `data-source.ts` (lista `ENTITIES` com as 18 entidades) e confirmar que o DataSource inicializa com migrations em banco temporário (teste de boot)

## 4. Rotas CRUD existentes

- [x] 4.1 Atualizar schemas/props das rotas existentes (`person`, `user`, `organization`, `organization-user`, `organization-user-profile`, `profile`, `profile-rule`, `module`, `module-rule`, `organization-module`, `country`) para os nomes novos (`code`, `shortName`/`name`, `address`/`district`/`cityId`/`zipCode`, `personId`, `systemId`), removendo `organizationId` das três pivots; verificar com specs de rota atualizados
- [x] 4.2 Criar `state.ts` (recurso `state` no lugar de `country-state.ts`), remover o arquivo antigo e registrar `/api/state` em `server.ts`; verificar com spec de rota cobrindo CRUD de país e estado (herdeiro de `country.spec.ts`)
- [x] 4.3 Verificar tratamento de erros 400/404/409 e auditoria (`user_updated` preenchido) num ciclo completo de um recurso afetado, via spec de rota

## 5. Rotas CRUD novas

- [x] 5.1 Criar `city.ts`, `person-address.ts` e `person-phone.ts` (`/api/city`, `/api/person-address`, `/api/person-phone`), com spec de rota cada (ciclo completo + 409 de FK)
- [x] 5.2 Criar `system.ts`, `module-organization.ts` e `user-authentication-mode.ts` (`/api/system`, `/api/module-organization`, `/api/user-authentication-mode`), com spec de rota cada (ciclo completo + unicidade de `userKey`)
- [x] 5.3 Registrar as 6 rotas novas em `server.ts` e verificar que o OpenAPI/Swagger lista os 18 recursos (`/documentation` ou JSON do OpenAPI)

## 6. Login real

- [x] 6.1 Reescrever `auth.ts` para validar contra `user`/`person` por email (join), comparar `password`, responder 200 com `LoginResponse` (`user.id` do usuário, `name`/`email` da pessoa) e 401 genérico; manter 400 do `isLoginRequest`; verificar com `auth.spec.ts` (credenciais válidas, senha errada, email desconhecido, corpo inválido)

## 7. Verificação integrada

- [x] 7.1 Rodar `pnpm build` e `pnpm typecheck` na raiz sem erros
- [x] 7.2 Rodar `pnpm --filter @monorepo/backend test` com todos os specs passando
- [x] 7.3 Smoke manual com `pnpm dev`: login real via `/api/auth/login` e ciclo CRUD completo em um recurso novo (ex.: `/api/system`) e em `/api/state`, conferindo auditoria no banco

## Workflow follow-up

- Arquivar a change após os requisitos de revisão do projeto serem atendidos.
- Verificar o resultado arquivado.
