# user-authentication Specification

## Purpose

Define a autenticação de usuários na API: validação das credenciais de login contra o modelo `user`/`person` persistido no banco de dados, com respostas padronizadas de sucesso e falha.

## Requirements

### Requirement: Login valida credenciais no banco de dados

O sistema SHALL validar, no endpoint `POST /api/auth/login`, o par email/senha contra o banco de dados: o email SHALL corresponder ao `email` de uma `person` que possua um `user` ativo associado, e a senha informada SHALL corresponder à `password` armazenada desse usuário.

#### Scenario: Credenciais válidas

- **WHEN** o login é enviado com o email de uma pessoa que possui usuário ativo e a senha igual à armazenada
- **THEN** a resposta é 200 com um token e os dados do usuário autenticado

#### Scenario: Email sem usuário correspondente

- **WHEN** o login é enviado com um email que não pertence a nenhuma pessoa com usuário ativo
- **THEN** a resposta é 401 com `{ message }` e nenhuma credencial é emitida

#### Scenario: Senha incorreta

- **WHEN** o login é enviado com um email existente e senha diferente da armazenada
- **THEN** a resposta é 401 com `{ message }`

#### Scenario: Corpo inválido

- **WHEN** a requisição de login não contém email e senha válidos
- **THEN** a resposta é 400 com `{ message }` descrevendo o problema

### Requirement: Resposta de login autenticado

O sistema SHALL responder a um login bem-sucedido com o contrato `LoginResponse` existente: `token` de sessão e `user` contendo `id` (identificador do usuário), `name` e `email` (identidade da pessoa vinculada).

#### Scenario: Identidade retornada

- **WHEN** o login é autenticado com sucesso
- **THEN** `user.id` corresponde ao identificador do usuário autenticado, e `user.name` e `user.email` correspondem aos dados da pessoa vinculada
