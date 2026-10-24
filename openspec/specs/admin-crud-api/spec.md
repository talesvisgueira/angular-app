# admin-crud-api Specification

## Purpose

Expõe a administração dos dados do modelo RBAC e geográfico por uma API REST com CRUD completo para as entidades persistidas, tratamento centralizado de erros e documentação Swagger auto-servida.

## Requirements

### Requirement: CRUD das entidades administrativas

O sistema SHALL expor, sob o prefixo `/api`, endpoints de criar, listar (com paginação simples por `limit`/`offset`), obter por `id`, atualizar e remover para cada uma das entidades persistidas: `person`, `user`, `organization`, `organization_user`, `organization_user_profile`, `profile`, `module`, `module_rule`, `profile_rule`, `organization_module`, `country`, `state`, `city`, `person_address`, `person_phone`, `user_authentication_mode`, `system` e `module_organization`, no formato `POST/GET /api/<recurso>` e `GET/PATCH/DELETE /api/<recurso>/:id`.

#### Scenario: Ciclo completo de um recurso

- **WHEN** um registro de qualquer recurso é criado via `POST`, consultado via `GET /:id`, atualizado via `PATCH /:id` e removido via `DELETE /:id`
- **THEN** cada operação responde com o código HTTP apropriado (201/200/200/204) e o estado final reflete a última operação

#### Scenario: Listagem paginada

- **WHEN** `GET /api/<recurso>?limit=10&offset=20` é chamado
- **THEN** a resposta contém no máximo `limit` registros a partir do `offset` indicado, com o total de registros disponível

#### Scenario: Relações respeitadas na criação

- **WHEN** um registro é criado referenciando entidades relacionadas por chave estrangeira (por exemplo, `user` com `person_id` de uma `person`, `module` com `system_id` de um `system` e `organization_id` de uma `organization`, `city` com `state_id` de um `state`)
- **THEN** o vínculo é persistido e respeita as FKs do modelo

### Requirement: Tratamento centralizado de erros da API

O sistema SHALL tratar erros de forma centralizada: corpo inválido ou campos obrigatórios ausentes respondem 400; registro inexistente em `GET/PATCH/DELETE /:id` responde 404; violação de chave estrangeira ou de unicidade responde 409; erros internos respondem 500 — todos com corpo JSON `{ message }` e sem expor stack traces.

#### Scenario: Corpo inválido

- **WHEN** um `POST` ou `PATCH` é enviado sem campos obrigatórios ou com tipos incorretos
- **THEN** a resposta é 400 com `{ message }` descrevendo o problema

#### Scenario: Registro inexistente

- **WHEN** `GET`, `PATCH` ou `DELETE` referencia um `id` que não existe
- **THEN** a resposta é 404 com `{ message }`

#### Scenario: Violação de integridade referencial

- **WHEN** uma operação fere FK ou unicidade (por exemplo, criar `state` sem país, remover uma `person` referenciada por um `user`, duplicar `short_name` de país)
- **THEN** a resposta é 409 com `{ message }`

### Requirement: Documentação Swagger da API

O sistema SHALL servir a especificação OpenAPI (JSON) da API e uma interface Swagger UI para todos os endpoints registrados (CRUD administrativo, `/health` e login), gerada a partir das definições das rotas, acessível em rotas dedicadas de documentação no próprio backend.

#### Scenario: Especificação OpenAPI disponível

- **WHEN** o endpoint JSON do OpenAPI é acessado
- **THEN** ele descreve todos os endpoints registrados, com seus métodos, parâmetros e códigos de resposta

#### Scenario: Interface Swagger UI

- **WHEN** a rota de documentação é aberta em um navegador
- **THEN** a UI Swagger carrega e permite executar as requisições contra o backend

### Requirement: Auditoria preenchida pela API

O sistema SHALL preencher automaticamente, em toda criação via API, `user_created`, `user_updated` (ambos com o identificador do usuário responsável; enquanto não houver autenticação real nas rotas CRUD, um valor de sistema), `data_created`, `data_updated` e `active` (verdadeiro quando não informado), e SHALL renovar `data_updated` e `user_updated` a cada atualização via API.

#### Scenario: Criação via API carimba auditoria

- **WHEN** um registro é criado por qualquer endpoint de CRUD
- **THEN** o registro armazenado possui `user_created`, `user_updated`, `data_created` e `data_updated` preenchidos e `active` verdadeiro quando não informado

#### Scenario: Atualização via API renova data_updated

- **WHEN** um registro é atualizado por `PATCH`
- **THEN** `data_updated` e `user_updated` passam a indicar a atualização e `data_created` permanece o valor original
