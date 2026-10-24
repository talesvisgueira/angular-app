# Proposal

## Why

A migration `AddNewDB1700000003000` recriou o esquema do banco com tabelas renomeadas, colunas novas e seis tabelas inéditas, mas as entidades TypeORM e as rotas Fastify ainda refletem o esquema antigo. Como o backend roda com `migrationsRun: true` e `synchronize: false`, a maioria das operações de escrita falha em runtime (colunas/tabelas inexistentes como `person.codigo` e `country_state`, colunas de auditoria `user_updated`/`active` obrigatórias não preenchidas) e seis tabelas seguem sem nenhum endpoint.

## What Changes

- Alinhamento das 13 entidades existentes ao esquema real do banco, sem novas migrations (o banco é a fonte de verdade):
  - `person`: `codigo` → `code`; inclusão de `active` e `user_updated`.
  - `country`: `sigla`/`nome` → `short_name` varchar(2)/`name`.
  - `country_state` → tabela `state` com `short_name`/`name` **BREAKING** (recurso `/api/country-state` passa a ser `/api/state`).
  - `organization`: `endereco`/`bairro`/`countrystate_id`/`telefone` → `address`/`district`/`city_id`/`zip_code`.
  - `user`: vínculo com `person` passa a ser por `person_id` (não mais por `id` compartilhado) e ganha `authentication_mode`.
  - `module`: ganha `system_id` obrigatório.
  - `module_rule`, `profile_rule`, `organization_user_profile`: removida a coluna `organization_id` que não existe mais nessas tabelas.
  - Todas as entidades passam a mapear as colunas de auditoria completas (`active`, `user_created`, `data_created`, `user_updated`, `data_updated`).
- Criação de entidades e rotas CRUD para as 6 tabelas sem cobertura: `city`, `person_address`, `person_phone`, `user_authentication_mode`, `system`, `module_organization` (prefixos `/api/city`, `/api/person-address`, `/api/person-phone`, `/api/user-authentication-mode`, `/api/system`, `/api/module-organization`).
- Preenchimento automático de auditoria completa nos endpoints de CRUD: `user_created`, `data_created`, `data_updated` na criação e `user_updated` também preenchido (valor de sistema enquanto não houver autenticação real nas rotas CRUD).
- **BREAKING**: `/api/auth/login` passa a validar credenciais contra as tabelas `user`/`person` (email da pessoa + senha do usuário) em vez do fluxo demo com senha fixa.
- Ajuste dos testes de backend (`country.spec.ts`, `entities.spec.ts`, `migrations.spec.ts`) e novos testes para os recursos criados.

## Capabilities

### New Capabilities

- `user-authentication`: validação de credenciais de login contra o modelo `user`/`person` (email + senha), com respostas de sucesso e falha padronizadas.

### Modified Capabilities

- `admin-crud-api`: a lista de recursos com CRUD passa de 12 para 18 (inclui `state` no lugar de `country_state` e os 6 novos recursos), os campos expostos nos payloads mudam para os nomes reais do banco e a auditoria passa a incluir `user_updated`/`active`.
- `rbac-data-model`: o contrato do modelo de dados passa a refletir o esquema criado pela migration `AddNewDB1700000003000` (renomeações, novas tabelas, `system_id` em `module`, `person_id` em `user`, colunas de auditoria completas).

## Impact

- **Código**: `apps/backend/src/entities/` (13 arquivos alterados, 6 novos), `apps/backend/src/routes/` (13 alterados, 6 novos, `auth.ts` reescrito), `routes/crud-helpers.ts` (auditoria), `database/data-source.ts` (lista de entidades), `server.ts` (registro de rotas).
- **API**: campos de request/response renomeados em vários recursos; rota `country-state` removida em favor de `state`; login deixa de aceitar qualquer email com senha fixa.
- **Compatibilidade**: o frontend consome apenas `/api/auth/login` e mantém o contrato `LoginResponse`; nenhuma mudança obrigatória no frontend.
- **Banco de dados**: nenhuma migration nova ou alterada; o esquema existente no SQLite é a fonte de verdade.
- **Testes**: specs de rota/entidade existentes precisam de atualização; novos testes cobrem os 6 recursos criados e o login real.
- **Fora de escopo**: hash de senhas (hoje comparadas/gravadas em texto puro — limitação a endereçar em change futura), autorização por perfil/RBAC nas rotas e `user_updated` com identidade real do solicitante.
