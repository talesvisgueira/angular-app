# Spec Delta

## Purpose

Define o contrato do modelo de dados multi-tenant que sustenta o controle de acesso granular (RBAC) do sistema: os domínios Pessoa, Organização, Usuário, Perfil, Módulo e Regras, suas relações, campos de auditoria, índices de isolamento e a disciplina de migrations que materializa o esquema no banco.

## ADDED Requirements

### Requirement: Pessoa como tenant raiz

O sistema SHALL persistir a entidade `Person` como escopo isolador principal (tenant), com `id` varchar(36) chave primária, `codigo` varchar(15) not null e único, `name` varchar(150) not null, `short_name` varchar(20) not null e único, `description` varchar(400) nulo permitido e `email` varchar(100) not null e único.

#### Scenario: Cadastro de pessoa válida

- **WHEN** uma pessoa é persistida com todos os campos obrigatórios preenchidos
- **THEN** o registro recebe um `id` UUID varchar(36) e é recuperável por `codigo`, `short_name` ou `email`

#### Scenario: Duplicidade de identificadores

- **WHEN** é feita uma tentativa de persistir uma pessoa com `codigo`, `short_name` ou `email` já existente
- **THEN** a persistência falha com erro de violação de unicidade

### Requirement: Organização como generalização de Pessoa

O sistema SHALL persistir a entidade `Organization` como generalização de `Person`, vinculada à sua pessoa raiz por chave estrangeira, acrescentando `endereco` varchar(100) not null e `bairro` varchar(80) not null.

#### Scenario: Criação de organização

- **WHEN** uma organização é criada referenciando uma `Person` existente
- **THEN** o registro armazena `endereco` e `bairro` obrigatórios e a relação com a pessoa raiz

### Requirement: Usuário atrelado a uma Pessoa

O sistema SHALL persistir a entidade `User` como entidade de autenticação, obrigatoriamente vinculada a uma `Person` por chave estrangeira.

#### Scenario: Usuário sem pessoa

- **WHEN** é feita uma tentativa de persistir um usuário sem pessoa associada
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

O sistema SHALL incluir as colunas `user_created` e `data_create` em todas as tabelas do modelo, preenchidas no momento da criação do registro.

#### Scenario: Novo registro recebe auditoria

- **WHEN** qualquer entidade do modelo é persistida
- **THEN** o registro possui `user_created` e `data_create` preenchidos

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
