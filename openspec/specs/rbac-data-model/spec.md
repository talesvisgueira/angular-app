# rbac-data-model Specification

## Purpose

Define o contrato do modelo de dados multi-tenant que sustenta o controle de acesso granular (RBAC) do sistema: os domínios Pessoa, Organização, Usuário, Perfil, Módulo e Regras, suas relações, campos de auditoria, índices de isolamento e a disciplina de migrations que materializa o esquema no banco.

## Requirements

### Requirement: Pessoa como tenant raiz

O sistema SHALL persistir a entidade `Person` como escopo isolador principal (tenant), com `id` varchar(36) chave primária, `code` varchar(15) not null e único, `name` varchar(150) not null, `short_name` varchar(20) not null e único, `description` varchar(400) nulo permitido e `email` varchar(100) not null e único.

#### Scenario: Cadastro de pessoa válida

- **WHEN** uma pessoa é persistida com todos os campos obrigatórios preenchidos
- **THEN** o registro recebe um `id` UUID varchar(36) e é recuperável por `code`, `short_name` ou `email`

#### Scenario: Duplicidade de identificadores

- **WHEN** é feita uma tentativa de persistir uma pessoa com `code`, `short_name` ou `email` já existente
- **THEN** a persistência falha com erro de violação de unicidade

### Requirement: Organização como generalização de Pessoa

O sistema SHALL persistir a entidade `Organization` como generalização de `Person` cuja chave primária `id` é, simultaneamente, chave estrangeira para `person.id` (não existindo coluna `person_id`), acrescentando `address` varchar(100) not null, `district` varchar(80) not null, `city_id` varchar(36) nulo com chave estrangeira para `city.id` e `zip_code` varchar(10) nulo.

#### Scenario: Criação de organização

- **WHEN** uma organização é criada com `id` correspondente a uma `Person` existente
- **THEN** o registro armazena `address` e `district` obrigatórios e a identidade é compartilhada com a pessoa raiz

#### Scenario: Identidade sem pessoa raiz

- **WHEN** é feita uma tentativa de persistir uma organização cujo `id` não corresponde a nenhuma `Person`
- **THEN** a persistência falha por violação de chave estrangeira

### Requirement: Usuário atrelado a uma Pessoa

O sistema SHALL persistir a entidade `User` como entidade de autenticação com coluna `person_id` varchar(36) not null e chave estrangeira para `person.id`, `username` varchar(100) not null e único, `password` varchar(200) not null e `authentication_mode` varchar(20) not null com padrão `PASSWORD`. A entidade `User` SHALL NOT possuir coluna `organization_id` (nem índice ou chave estrangeira próprias): o vínculo entre usuário e organização é mantido exclusivamente pela tabela pivot `organization_user`.

#### Scenario: Usuário sem pessoa

- **WHEN** é feita uma tentativa de persistir um usuário cujo `person_id` não corresponde a nenhuma `Person`
- **THEN** a persistência falha por violação de chave estrangeira

#### Scenario: Vínculo de usuário com organização

- **WHEN** o vínculo entre um usuário e uma organização precisa ser consultado ou criado
- **THEN** ele é lido/gravado exclusivamente por registros de `organization_user`, sem coluna direta em `user`

### Requirement: Modos alternativos de autenticação do usuário

O sistema SHALL persistir a entidade `UserAuthenticationMode` (`id` varchar(36) chave primária, `user_id` not null com chave estrangeira para `user.id`, `user_key` varchar(100) not null e único, `key_value` varchar(400) not null), com colunas de auditoria.

#### Scenario: Chave de autenticação única

- **WHEN** são persistidos dois registros com o mesmo `user_key`
- **THEN** a segunda persistência falha com erro de violação de unicidade

#### Scenario: Vínculo com usuário

- **WHEN** um modo de autenticação é criado para um usuário existente
- **THEN** o vínculo é persistido e consultável por `user_id`

### Requirement: Cadastro geográfico de países e estados

O sistema SHALL persistir a entidade `Country` (`id` varchar(36) chave primária, `short_name` varchar(2) not null e único, `name` varchar(80) not null) e a entidade `State` persistida na tabela `state` (`id` varchar(36) chave primária, `country_id` not null com chave estrangeira para `country.id`, `short_name` varchar(2) not null, `name` varchar(80) not null), ambas com colunas de auditoria.

#### Scenario: Criação de país

- **WHEN** um país é persistido com `short_name` e `name` preenchidos
- **THEN** o registro recebe um `id` UUID varchar(36) e é recuperável por `short_name`

#### Scenario: Estado vinculado a país

- **WHEN** um estado é persistido referenciando um país existente
- **THEN** o registro armazena a relação com o país por chave estrangeira

#### Scenario: Estado sem país

- **WHEN** é feita uma tentativa de persistir um estado sem país associado
- **THEN** a persistência falha por violação de chave estrangeira

### Requirement: Cidade vinculada a estado

O sistema SHALL persistir a entidade `City` na tabela `city` (`id` varchar(36) chave primária, `state_id` not null com chave estrangeira para `state.id`, `short_name` varchar(15) not null, `name` varchar(80) not null), com colunas de auditoria.

#### Scenario: Criação de cidade

- **WHEN** uma cidade é persistida referenciando um estado existente
- **THEN** o registro armazena a relação com o estado por chave estrangeira e é consultável por `state_id`

#### Scenario: Cidade sem estado

- **WHEN** é feita uma tentativa de persistir uma cidade sem estado associado
- **THEN** a persistência falha por violação de chave estrangeira

### Requirement: Localização e hierarquia da organização

O sistema SHALL incluir na entidade `Organization` os campos `city_id` varchar(36) nulo com chave estrangeira para `city.id`, `zip_code` varchar(10) nulo e `parent_id` varchar(36) nulo com chave estrangeira auto-relacionada para `organization.id`.

#### Scenario: Organização com cidade e CEP

- **WHEN** uma organização é criada informando cidade e CEP válidos
- **THEN** os valores são persistidos e a cidade referenciada existe em `city`

#### Scenario: Organização sem localização

- **WHEN** uma organização é criada sem cidade e sem CEP
- **THEN** os campos permanecem nulos e a persistência é bem-sucedida

#### Scenario: Hierarquia de organizações

- **WHEN** uma organização é criada com `parent_id` apontando para outra organização existente
- **THEN** a relação pai-filha é persistida e consultável a partir da organização pai

#### Scenario: Pai inexistente

- **WHEN** é feita uma tentativa de persistir uma organização com `parent_id` inexistente
- **THEN** a persistência falha por violação de chave estrangeira

### Requirement: Endereço da pessoa

O sistema SHALL persistir a entidade `PersonAddress` (`id` varchar(36) chave primária, `person_id` nulo permitido com chave estrangeira para `person.id`, `address` varchar(100) not null, `district` varchar(80) not null, `zip_code` varchar(10) nulo, `city_id`, `country_id` e `state_id` nulos com chaves estrangeiras), com colunas de auditoria.

#### Scenario: Endereço vinculado a pessoa

- **WHEN** um endereço é criado para uma pessoa existente
- **THEN** o vínculo é persistido por `person_id` e o endereço é consultável pela pessoa

#### Scenario: Cidade inexistente no endereço

- **WHEN** é feita uma tentativa de persistir um endereço cujo `city_id` não corresponde a nenhuma `City`
- **THEN** a persistência falha por violação de chave estrangeira

### Requirement: Telefone da pessoa

O sistema SHALL persistir a entidade `PersonPhone` (`id` varchar(36) chave primária, `person_id` nulo permitido com chave estrangeira para `person.id`, `country_id` numeric(2) not null, `code` numeric(3) not null e `number` numeric(10) nulo), com colunas de auditoria.

#### Scenario: Telefone de pessoa

- **WHEN** um telefone é criado para uma pessoa existente
- **THEN** o registro armazena código de país, código de área e número vinculados à pessoa

### Requirement: Ativação de módulos por organização

O sistema SHALL persistir a entidade `OrganizationModule` (`id` varchar(36) chave primária, `organization_id` not null com chave estrangeira para `organization.id`, `module_id` not null com chave estrangeira para `module.id`, `active` not null), com colunas de auditoria.

#### Scenario: Ativação de módulo para organização

- **WHEN** um vínculo `OrganizationModule` é criado para uma organização e um módulo existentes
- **THEN** o vínculo é persistido com o estado de ativação indicado

#### Scenario: Vínculo com módulo inexistente

- **WHEN** é feita uma tentativa de persistir um vínculo com módulo ou organização inexistentes
- **THEN** a persistência falha por violação de chave estrangeira

### Requirement: Sistema como catálogo de módulos

O sistema SHALL persistir a entidade `System` (`id` varchar(36) chave primária, `name` varchar(80) not null, `description` varchar(400) nulo permitido) como catálogo que agrupa os módulos, com colunas de auditoria.

#### Scenario: Criação de sistema

- **WHEN** um sistema é persistido com `name` preenchido
- **THEN** o registro recebe um `id` UUID varchar(36) e é recuperável por `id`

### Requirement: Relações de perfis, módulos e regras

O sistema SHALL persistir `Profile`, `Module`, `ModuleRule` (regras vinculadas a um módulo) e as relações pivot `ProfileRule` (perfil ↔ regra de módulo), `OrganizationUser` (usuário em organização) e `OrganizationUserProfile` (organização-usuário ↔ perfil), todas por chaves estrangeiras. `Module` SHALL incluir `system_id` not null com chave estrangeira para `system.id`; `ModuleRule`, `ProfileRule` e `OrganizationUserProfile` SHALL NOT possuir coluna `organization_id`.

#### Scenario: Atribuição de regra a perfil

- **WHEN** uma `ProfileRule` é criada associando um perfil a uma regra de módulo
- **THEN** a relação é persistida e consultável por perfil e por regra

#### Scenario: Perfil de usuário em organização

- **WHEN** uma `OrganizationUserProfile` é criada
- **THEN** ela referencia um vínculo `OrganizationUser` e um `Profile` existentes

#### Scenario: Módulo sem sistema

- **WHEN** é feita uma tentativa de persistir um módulo cujo `system_id` não corresponde a nenhum `System`
- **THEN** a persistência falha por violação de chave estrangeira

### Requirement: Publicação de módulos para organizações

O sistema SHALL persistir a entidade `ModuleOrganization` (`id` varchar(36) chave primária, `organization_id` not null com chave estrangeira para `organization.id`, `module_id` not null com chave estrangeira para `module.id`, `name` varchar(80) not null, `description` varchar(400) nulo permitido), com colunas de auditoria.

#### Scenario: Publicação de módulo para organização

- **WHEN** um vínculo `ModuleOrganization` é criado para uma organização e um módulo existentes
- **THEN** o vínculo é persistido e consultável por organização e por módulo

#### Scenario: Vínculo com módulo inexistente

- **WHEN** é feita uma tentativa de persistir um vínculo com módulo ou organização inexistentes
- **THEN** a persistência falha por violação de chave estrangeira

### Requirement: Auditoria em todas as tabelas

O sistema SHALL incluir em todas as tabelas do modelo as colunas `active` boolean not null com padrão verdadeiro, `user_created` varchar(36) not null, `data_created` datetime not null, `user_updated` varchar(36) not null e `data_updated` datetime not null. `data_created` SHALL ser preenchida no momento da criação do registro e `data_updated` SHALL ser preenchida tanto na criação quanto a cada atualização subsequente.

#### Scenario: Novo registro recebe auditoria

- **WHEN** qualquer entidade do modelo é persistida
- **THEN** o registro possui `user_created`, `user_updated`, `data_created` e `data_updated` preenchidos

#### Scenario: Atualização renova data_updated

- **WHEN** um registro existente é atualizado
- **THEN** `data_updated` é renovada e `data_created` permanece inalterada

#### Scenario: Registro criado ativo por padrão

- **WHEN** um registro é persistido sem informar `active`
- **THEN** a coluna `active` fica verdadeira por padrão do banco

### Requirement: Isolamento multi-tenant por organization_id

O sistema SHALL incluir a coluna `organization_id` nas tabelas dependentes de organização (`organization_user`, `profile`, `module`, `module_organization` e `organization_module`), garantindo o isolamento de dados entre tenants.

#### Scenario: Consulta com filtro de tenant

- **WHEN** registros de uma tabela dependente são consultados por `organization_id`
- **THEN** apenas os registros daquela organização são retornados

### Requirement: Esquema evolui somente por migrations

O sistema SHALL manter a sincronização automática de esquema desabilitada (`synchronize: false`), criando e alterando tabelas exclusivamente por arquivos de migration versionados, e a aplicação SHALL falhar ao iniciar caso a aplicação das migrations pendentes não seja concluída.

#### Scenario: Migration inicial cria o esquema

- **WHEN** a migration inicial é executada contra um banco SQLite vazio
- **THEN** todas as tabelas, chaves, índices e colunas de auditoria dos domínios são criados

#### Scenario: Nova coluna exige migration

- **WHEN** uma entidade é alterada para incluir uma nova coluna
- **THEN** uma nova migration é gerada e aplicada antes que o novo campo seja utilizável, sem sincronização automática
