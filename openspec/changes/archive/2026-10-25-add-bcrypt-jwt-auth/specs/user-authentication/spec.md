# Spec Delta

## ADDED Requirements

### Requirement: Senhas armazenadas apenas como hash bcrypt

O sistema SHALL armazenar a senha de usuários criados ou atualizados pela API de usuários apenas como hash bcrypt, e SHALL converter para hash as senhas persistidas em texto plano por versões anteriores, de modo que nenhum valor de senha legível permaneça no banco de dados.

#### Scenario: Usuário criado pela API recebe hash de senha

- **WHEN** um usuário é criado (POST) ou atualizado (PATCH) pela API de usuários com uma senha em texto plano
- **THEN** a senha persistida é um hash bcrypt e não corresponde ao texto informado

#### Scenario: Usuários pré-existentes continuam autenticando

- **WHEN** um usuário cuja senha estava armazenada em texto plano antes da mudança faz login com essa senha
- **THEN** a senha é convertida para hash bcrypt e o login é autenticado com sucesso

### Requirement: Validação de token pelo servidor

O sistema SHALL expor `POST /api/auth/validate`, que verifica a assinatura e a expiração do JWT informado no header `Authorization: Bearer <token>` e devolve os claims do token.

#### Scenario: Token válido é verificado

- **WHEN** o endpoint recebe um JWT assinado pelo servidor e ainda não expirado
- **THEN** a resposta é 200 com os claims do token (`sub`, `email`, `name`, `profiles`, `exp`)

#### Scenario: Token ausente, inválido ou expirado

- **WHEN** o header `Authorization` está ausente, o token não é um JWT assinado pelo servidor ou já está expirado
- **THEN** a resposta é 401 com `{ message }`

## MODIFIED Requirements

### Requirement: Login valida credenciais no banco de dados

O sistema SHALL validar, no endpoint `POST /api/auth/login`, o par email/senha contra o banco de dados: o email SHALL corresponder ao `email` de uma `person` que possua um `user` ativo associado, e a senha informada SHALL corresponder, por comparação bcrypt, ao hash armazenado desse usuário — nunca por igualdade direta com texto plano.

#### Scenario: Credenciais válidas

- **WHEN** o login é enviado com o email de uma pessoa que possui usuário ativo e a senha correspondente ao hash armazenado
- **THEN** a resposta é 200 com um token e os dados do usuário autenticado

#### Scenario: Email sem usuário correspondente

- **WHEN** o login é enviado com um email que não pertence a nenhuma pessoa com usuário ativo
- **THEN** a resposta é 401 com `{ message }` e nenhuma credencial é emitida

#### Scenario: Senha incorreta

- **WHEN** o login é enviado com um email existente e senha que não corresponde ao hash armazenado
- **THEN** a resposta é 401 com `{ message }`

#### Scenario: Corpo inválido

- **WHEN** a requisição de login não contém email e senha válidos
- **THEN** a resposta é 400 com `{ message }` descrevendo o problema

### Requirement: Resposta de login autenticado

O sistema SHALL responder a um login bem-sucedido com o contrato `LoginResponse`: `token` contendo um JWT assinado (HS256) com expiração de 20 minutos, cujo payload inclui `sub` (id do usuário), `email`, `name` e `profiles` (nomes dos perfis ativos do usuário, via vínculos `organization_user_profile` ativos); e `user` contendo `id`, `name`, `email` e `profiles` da identidade autenticada.

#### Scenario: Identidade retornada

- **WHEN** o login é autenticado com sucesso
- **THEN** `user.id` corresponde ao usuário autenticado, `user.name` e `user.email` correspondem à pessoa vinculada, e `user.profiles` contém os nomes dos perfis ativos vinculados a esse usuário

#### Scenario: Token emitido é um JWT expirável de 20 minutos

- **WHEN** o login é autenticado com sucesso
- **THEN** `token` é um JWT decodificável cujo payload contém `sub`, `email`, `name`, `profiles` e `exp` a aproximadamente 20 minutos no futuro

#### Scenario: Usuário sem perfis vinculados

- **WHEN** o usuário autenticado não possui vínculos ativos em `organization_user_profile`
- **THEN** `profiles` é retornado como array vazio, tanto no `user` quanto no payload do token
