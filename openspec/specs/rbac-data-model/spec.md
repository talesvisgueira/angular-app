# rbac-data-model Specification

## Purpose

Define o contrato do modelo de dados multi-tenant que sustenta o controle de acesso granular (RBAC) do sistema: os domínios Pessoa, Organização, Usuário, Perfil, Módulo e Regras, suas relações, campos de auditoria, índices de isolamento e a disciplina de migrations que materializa o esquema no banco.

## Requirements

### Requirement: Pessoa como tenant raiz

O sistema SHALL persistir a entidade `Person` como escopo isolador principal (tenant), com `id` varchar(36) chave primária, `codigo` varchar(15) not null e único, `name` varchar(150) not null, `short_name` varchar(20) not null e único, `description` varchar(400) nulo permitido e `email` varchar(100) not null e único.

#### Scenario: Cadastro de pessoa válida

- **WHEN** uma pessoa é persistida com todos os campos obrigatórios preenchidos
- **THEN** o registro recebe um `id` UUID varchar(36) e é recuperável por `codigo`, `short_name` ou `email`

#### Scenario: Duplicidade de identificadores

- **WHEN** é feita uma tentativa de persistir uma pessoa com `codigo`, `short_name` ou `email` já existente
- **THEN** a persistência falha com erro de violação de unicidade

### Requirement: Organização como generalização de Pessoa

O sistema SHALL persistir a entidade `Organization` como generalização de `Person` cuja chave primária `id` é, simultaneamente, chave estrangeira para `person.id` (não existindo coluna `person_id`), acrescentando `endereco` varchar(100) not null e `bairro` varchar(80) not null.

#### Scenario: Criação de organização

- **WHEN** uma organização é criada com `id` correspondente a uma `Person` existente
- **THEN** o registro armazena `endereco` e `bairro` obrigatórios e a identidade é compartilhada com a pessoa raiz

#### Scenario: Identidade sem pessoa raiz

- **WHEN** é feita uma tentativa de persistir uma organização cujo `id` não corresponde a nenhuma `Person`
- **THEN** a persistência falha por violação de chave estrangeira

### Requirement: Usuário atrelado a uma Pessoa

O sistema SHALL persistir a entidade `User` como entidade de autenticação cuja chave primária `id` é, simultaneamente, chave estrangeira para `person.id` (não existindo coluna `person_id`). A entidade `User` SHALL NOT possuir coluna `organization_id` (nem índice ou chave estrangeira próprias): o vínculo entre usuário e organização é mantido exclusivamente pela tabela pivot `organization_user`.

#### Scenario: Usuário sem pessoa

- **WHEN** é feita uma tentativa de persistir um usuário cujo `id` não corresponde a nenhuma `Person`
- **THEN** a persistência falha por violação de chave estrangeira

#### Scenario: Vínculo de usuário com organização

- **WHEN** o vínculo entre um usuário e uma organização precisa ser consultado ou criado
- **THEN** ele é lido/gravado exclusivamente por registros de `organization_user`, sem coluna direta em `user`

### Requirement: Cadastro geográfico de países e estados

O sistema SHALL persistir a entidade `Country` (`id` varchar(36) chave primária, `sigla` not null e única, `nome` not null) e a entidade `CountryState` (`id` varchar(36) chave primária, `country_id` not null com chave estrangeira para `country.id`, `sigla` not null, `nome` not null), ambas com colunas de auditoria.

#### Scenario: Criação de país

- **WHEN** um país é persistido com `sigla` e `nome` preenchidos
- **THEN** o registro recebe um `id` UUID varchar(36) e é recuperável por `sigla`

#### Scenario: Estado vinculado a país

- **WHEN** um estado é persistido referenciando um país existente
- **THEN** o registro armazena a relação com o país por chave estrangeira

#### Scenario: Estado sem país

- **WHEN** é feita uma tentativa de persistir um estado sem país associado
- **THEN** a persistência falha por violação de chave estrangeira

### Requirement: Localização, telefone e hierarquia da organização

O sistema SHALL incluir na entidade `Organization` os campos `countrystate_id` (nullable, chave estrangeira para `country_state.id`), `telefone` varchar(13) nullable e `parent_id` varchar(36) nullable com chave estrangeira auto-relacionada para `organization.id`.

#### Scenario: Organização com estado e telefone

- **WHEN** uma organização é criada informando estado e telefone válidos
- **THEN** os valores são persistidos e o estado referenciado existe em `country_state`

#### Scenario: Organização sem localização

- **WHEN** uma organização é criada sem estado e sem telefone
- **THEN** os campos permanecem nulos e a persistência é bem-sucedida

#### Scenario: Hierarquia de organizações

- **WHEN** uma organização é criada com `parent_id` apontando para outra organização existente
- **THEN** a relação pai-filha é persistida e consultável a partir da organização pai

#### Scenario: Pai inexistente

- **WHEN** é feita uma tentativa de persistir uma organização com `parent_id` inexistente
- **THEN** a persistência falha por violação de chave estrangeira

### Requirement: Ativação de módulos por organização

O sistema SHALL persistir a entidade `OrganizationModule` (`id` varchar(36) chave primária, `organization_id` not null com chave estrangeira para `organization.id`, `module_id` not null com chave estrangeira para `module.id`, `active` not null), com colunas de auditoria.

#### Scenario: Ativação de módulo para organização

- **WHEN** um vínculo `OrganizationModule` é criado para uma organização e um módulo existentes
- **THEN** o vínculo é persistido com o estado de ativação indicado

#### Scenario: Vínculo com módulo inexistente

- **WHEN** é feita uma tentativa de persistir um vínculo com módulo ou organização inexistentes
- **THEN** a persistência falha por violação de chave estrangeira

### Requirement: Relações de perfis, módulos e regras

O sistema SHALL persistir `Profile`, `Module`, `ModuleRule` (regras vinculadas a um módulo) e as relações pivot `ProfileRule` (perfil ↔ regra de módulo), `OrganizationUser` (usuário em organização) e `OrganizationUserProfile` (organização-usuário ↔ perfil), todas por chaves estrangeiras.

#### Scenario: Atribuição de regra a perfil

- **WHEN** uma `ProfileRule` é criada associando um perfil a uma regra de módulo
- **THEN** a relação é persistida e consultável por perfil e por regra

#### Scenario: Perfil de usuário em organização

- **WHEN** uma `OrganizationUserProfile` é criada
- **THEN** ela referencia um vínculo `OrganizationUser` e um `Profile` existentes

### Requirement: Auditoria em todas as tabelas

O sistema SHALL incluir em todas as tabelas do modelo as colunas `user_created` varchar(36) not null, `data_created` timestamp not null e `data_updated` timestamp not null. `data_created` SHALL ser preenchida no momento da criação do registro e `data_updated` SHALL ser preenchida tanto na criação quanto a cada atualização subsequente.

#### Scenario: Novo registro recebe auditoria

- **WHEN** qualquer entidade do modelo é persistida
- **THEN** o registro possui `user_created`, `data_created` e `data_updated` preenchidos

#### Scenario: Atualização renova data_updated

- **WHEN** um registro existente é atualizado
- **THEN** `data_updated` é renovada e `data_created` permanece inalterada

### Requirement: Isolamento multi-tenant por organization_id

O sistema SHALL incluir a coluna `organization_id` com índice em todas as tabelas dependentes de organização, garantindo o isolamento de dados entre tenants.

#### Scenario: Consulta com filtro de tenant

- **WHEN** registros de uma tabela dependente são consultados por `organization_id`
- **THEN** apenas os registros daquela organização são retornados e a coluna é indexada

### Requirement: Esquema evolui somente por migrations

O sistema SHALL manter a sincronização automática de esquema desabilitada (`synchronize: false`), criando e alterando tabelas exclusivamente por arquivos de migration versionados, e a aplicação SHALL falhar ao iniciar caso a aplicação das migrations pendentes não seja concluída.

#### Scenario: Migration inicial cria o esquema

- **WHEN** a migration inicial é executada contra um banco SQLite vazio
- **THEN** todas as tabelas, chaves, índices e colunas de auditoria dos domínios são criados

#### Scenario: Nova coluna exige migration

- **WHEN** uma entidade é alterada para incluir uma nova coluna
- **THEN** uma nova migration é gerada e aplicada antes que o novo campo seja utilizável, sem sincronização automática
