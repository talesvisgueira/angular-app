# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Organização como generalização de Pessoa

O sistema SHALL persistir a entidade `Organization` como generalização de `Person` cuja chave primária `id` é, simultaneamente, chave estrangeira para `person.id` (não existindo coluna `person_id`), acrescentando `endereco` varchar(100) not null e `bairro` varchar(80) not null.

#### Scenario: Criação de organização

- **WHEN** uma organização é criada com `id` correspondente a uma `Person` existente
- **THEN** o registro armazena `endereco` e `bairro` obrigatórios e a identidade é compartilhada com a pessoa raiz

#### Scenario: Identidade sem pessoa raiz

- **WHEN** é feita uma tentativa de persistir uma organização cujo `id` não corresponde a nenhuma `Person`
- **THEN** a persistência falha por violação de chave estrangeira

### Requirement: Usuário atrelado a uma Pessoa

O sistema SHALL persistir a entidade `User` como entidade de autenticação cuja chave primária `id` é, simultaneamente, chave estrangeira para `person.id` (não existindo coluna `person_id`).

#### Scenario: Usuário sem pessoa

- **WHEN** é feita uma tentativa de persistir um usuário cujo `id` não corresponde a nenhuma `Person`
- **THEN** a persistência falha por violação de chave estrangeira
