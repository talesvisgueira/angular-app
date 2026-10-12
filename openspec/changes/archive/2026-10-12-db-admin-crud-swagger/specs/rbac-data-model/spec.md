# Spec Delta

## MODIFIED Requirements

### Requirement: Usuário atrelado a uma Pessoa

O sistema SHALL persistir a entidade `User` como entidade de autenticação cuja chave primária `id` é, simultaneamente, chave estrangeira para `person.id` (não existindo coluna `person_id`). A entidade `User` SHALL NOT possuir coluna `organization_id` (nem índice ou chave estrangeira próprias): o vínculo entre usuário e organização é mantido exclusivamente pela tabela pivot `organization_user`.

#### Scenario: Usuário sem pessoa

- **WHEN** é feita uma tentativa de persistir um usuário cujo `id` não corresponde a nenhuma `Person`
- **THEN** a persistência falha por violação de chave estrangeira

#### Scenario: Vínculo de usuário com organização

- **WHEN** o vínculo entre um usuário e uma organização precisa ser consultado ou criado
- **THEN** ele é lido/gravado exclusivamente por registros de `organization_user`, sem coluna direta em `user`

### Requirement: Auditoria em todas as tabelas

O sistema SHALL incluir em todas as tabelas do modelo as colunas `user_created` varchar(36) not null, `data_created` timestamp not null e `data_updated` timestamp not null. `data_created` SHALL ser preenchida no momento da criação do registro e `data_updated` SHALL ser preenchida tanto na criação quanto a cada atualização subsequente.

#### Scenario: Novo registro recebe auditoria

- **WHEN** qualquer entidade do modelo é persistida
- **THEN** o registro possui `user_created`, `data_created` e `data_updated` preenchidos

#### Scenario: Atualização renova data_updated

- **WHEN** um registro existente é atualizado
- **THEN** `data_updated` é renovada e `data_created` permanece inalterada
