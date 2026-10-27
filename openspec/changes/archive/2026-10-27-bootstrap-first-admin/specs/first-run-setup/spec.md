# Spec Delta

## Purpose

Provisionar o sistema na primeira execução: expor a verificação pública da existência de usuários cadastrados e permitir, somente enquanto não houver nenhum, o cadastro atômico do primeiro administrador com sua organização e o perfil Administrador, seguido de sessão autenticada.

## ADDED Requirements

### Requirement: Verificação pública da existência de usuários

O sistema SHALL expor o endpoint `GET /api/auth/has-users`, sem exigir autenticação, respondendo 200 com `{ hasUsers: boolean }`: `true` quando existir pelo menos um registro de usuário cadastrado (ativo ou não) e `false` quando a base não tiver nenhum.

#### Scenario: Sistema sem usuários cadastrados

- **WHEN** `GET /api/auth/has-users` é chamado em uma base sem nenhum registro na tabela `user`
- **THEN** a resposta é 200 com `{ hasUsers: false }`

#### Scenario: Sistema com usuário cadastrado

- **WHEN** `GET /api/auth/has-users` é chamado em uma base com pelo menos um registro na tabela `user`
- **THEN** a resposta é 200 com `{ hasUsers: true }`

### Requirement: Cadastro inicial do administrador e da organização

O sistema SHALL expor o endpoint público `POST /api/auth/setup` que, recebendo os dados da organização (nome, email) e do administrador (nome, email, username, senha), cria em uma única transação: a organização com sua person raiz, o usuário do administrador com sua person, o vínculo organização-usuário, o perfil `Administrador` da organização e o vínculo ativo deste com o administrador.

#### Scenario: Primeiro cadastro bem-sucedido

- **WHEN** `POST /api/auth/setup` é chamado em uma base sem usuários, com dados válidos de organização e administrador
- **THEN** a resposta é 201, a senha do administrador fica armazenada apenas como hash bcrypt e a base passa a conter a organização criada, o usuário do administrador, o vínculo organização-usuário, o perfil `Administrador` da organização e o vínculo ativo entre eles

#### Scenario: Campos obrigatórios não informados recebem padrão

- **WHEN** o cadastro mínimo não informa campos obrigatórios do modelo (`code` e `short_name` das persons, `address` e `district` da organização)
- **THEN** o backend os preenche com valores gerados ou padrão e o cadastro é concluído

#### Scenario: Resposta com sessão do administrador

- **WHEN** o cadastro inicial é concluído com sucesso
- **THEN** a resposta contém o mesmo contrato `LoginResponse` do login: `token` JWT assinado (HS256, `exp` de 20 minutos) com `sub`, `email`, `name` e `profiles` no payload, e `user` com `id`, `name`, `email` e `profiles` contendo `Administrador`

#### Scenario: Administrador criado consegue logar

- **WHEN** após um cadastro inicial bem-sucedido o login é feito com o email e a senha informados no cadastro
- **THEN** a resposta é 200 com token e dados do administrador

### Requirement: Cadastro inicial permitido somente sem usuários

O sistema SHALL aceitar `POST /api/auth/setup` somente enquanto não existir nenhum usuário cadastrado na base; havendo pelo menos um usuário (ativo ou não), o endpoint SHALL responder 409 e não criar nenhum registro.

#### Scenario: Setup com base já populada

- **WHEN** `POST /api/auth/setup` é chamado em uma base que já possui pelo menos um usuário
- **THEN** a resposta é 409 com `{ message }` e nenhum registro é criado

#### Scenario: Corrida de cadastros simultâneos

- **WHEN** duas chamadas de `POST /api/auth/setup` são aceitas quase simultaneamente em uma base sem usuários
- **THEN** no máximo uma cria os registros e a outra responde 409

### Requirement: Validações e conflitos do cadastro inicial

O sistema SHALL validar o corpo de `POST /api/auth/setup`: nome e email da organização, nome, email e username do administrador e senha com no mínimo 6 caracteres são obrigatórios, e os emails SHALL ter formato válido. Corpo inválido SHALL responder 400 com `{ message }`. Username ou email já utilizado SHALL responder 409 com `{ message }` sem criar registros.

#### Scenario: Corpo incompleto

- **WHEN** o cadastro é enviado sem algum dos campos obrigatórios ou com senha menor que 6 caracteres
- **THEN** a resposta é 400 com `{ message }` e nenhum registro é criado

#### Scenario: Username já utilizado

- **WHEN** o cadastro é enviado com um username já existente na base
- **THEN** a resposta é 409 com `{ message }` e nenhum registro é criado

#### Scenario: Email já utilizado

- **WHEN** o cadastro é enviado com email (da organização ou do administrador) já existente em outra person
- **THEN** a resposta é 409 com `{ message }` e nenhum registro é criado

### Requirement: Formulário de cadastro inicial no frontend

A aplicação SHALL oferecer a rota pública `/signup` com o formulário de cadastro inicial contendo os campos da organização (nome, email) e do administrador (nome, email, username, senha e confirmação de senha), com validação local de preenchimento obrigatório, formato de email, senha de no mínimo 6 caracteres e igualdade entre senha e confirmação.

#### Scenario: Formulário válido submete o cadastro

- **WHEN** o formulário é preenchido corretamente e submetido
- **THEN** `POST /api/auth/setup` é chamado com os dados da organização e do administrador, sem o campo de confirmação de senha

#### Scenario: Senhas não conferem

- **WHEN** a confirmação de senha difere da senha informada
- **THEN** o formulário indica o erro localmente e nenhuma requisição é enviada

#### Scenario: Campos obrigatórios ausentes não enviam requisição

- **WHEN** o formulário é submetido com campos obrigatórios vazios, email inválido ou senha menor que 6 caracteres
- **THEN** o formulário indica os erros localmente e nenhuma requisição é enviada

### Requirement: Resultado do cadastro na tela

Ao submeter o formulário, a aplicação SHALL tratar a resposta de `POST /api/auth/setup`: em caso de sucesso (201) SHALL estabelecer a sessão com a resposta (login automático) e navegar para a página principal; em caso de falha (400 ou 409) SHALL permanecer em `/signup` com mensagem de erro, sem armazenar sessão.

#### Scenario: Erro do backend permanece na tela

- **WHEN** o backend responde 400 ou 409 ao cadastro
- **THEN** a aplicação permanece em `/signup` com mensagem de erro e nenhuma sessão é armazenada

#### Scenario: Sucesso navega autenticado para a página principal

- **WHEN** o backend responde 201 ao cadastro
- **THEN** a sessão retornada é armazenada e a aplicação navega para a página principal com o administrador autenticado

### Requirement: Tela de cadastro acessível somente sem usuários

Quando a tela de cadastro inicial é aberta e já existem usuários cadastrados, a aplicação SHALL redirecionar para a tela de login.

#### Scenario: Tela acessada com usuários já cadastrados

- **WHEN** `/signup` é aberta e `GET /api/auth/has-users` responde `{ hasUsers: true }`
- **THEN** a aplicação redireciona para a tela de login
