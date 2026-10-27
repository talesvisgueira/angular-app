# Spec Delta

## MODIFIED Requirements

### Requirement: Acesso não autenticado redireciona para o login

A aplicação SHALL redirecionar para a tela de login qualquer acesso à página principal sem sessão ativa. Além disso, o direcionamento de entrada sem sessão SHALL considerar a existência de usuários cadastrados (`GET /api/auth/has-users`): sem nenhum usuário, a aplicação SHALL direcionar para a tela de cadastro inicial (`/signup`) em vez da tela de login, tanto na decisão da splash quanto ao abrir a tela de login.

#### Scenario: Página principal sem sessão

- **WHEN** a página principal é acessada diretamente sem sessão ativa
- **THEN** a aplicação redireciona para a tela de login

#### Scenario: Rota inicial

- **WHEN** a aplicação é aberta na rota vazia
- **THEN** a aplicação redireciona para a página principal, que por sua vez redireciona para o login quando não há sessão ativa

#### Scenario: Splash sem usuários cadastrados direciona ao cadastro

- **WHEN** a splash termina sem sessão ativa e `GET /api/auth/has-users` responde `{ hasUsers: false }`
- **THEN** a aplicação navega para `/signup` em vez da tela de login

#### Scenario: Splash com usuários cadastrados direciona ao login

- **WHEN** a splash termina sem sessão ativa e `GET /api/auth/has-users` responde `{ hasUsers: true }`
- **THEN** a aplicação navega para a tela de login

#### Scenario: Tela de login sem usuários cadastrados redireciona ao cadastro

- **WHEN** a tela de login é aberta sem sessão ativa e `GET /api/auth/has-users` responde `{ hasUsers: false }`
- **THEN** a aplicação redireciona para `/signup`

#### Scenario: Tela de login com usuários cadastrados permanece

- **WHEN** a tela de login é aberta sem sessão ativa e `GET /api/auth/has-users` responde `{ hasUsers: true }`
- **THEN** a aplicação permanece na tela de login

## ADDED Requirements

### Requirement: Cadastro inicial estabelece sessão

Quando `POST /api/auth/setup` responde 201, a aplicação SHALL validar o token recebido (estrutura de JWT com payload decodificável e `exp` no futuro) e estabelecer a sessão da mesma forma que um login: armazenar `token` e `user` e navegar para a página principal. Com token estruturalmente inválido ou expirado, a aplicação SHALL permanecer na tela de cadastro com mensagem de erro, sem armazenar sessão.

#### Scenario: Cadastro bem-sucedido cria a sessão

- **WHEN** o cadastro inicial responde 201 com um token JWT estruturalmente válido e não expirado
- **THEN** a sessão é armazenada e a aplicação navega para a página principal

#### Scenario: Token inválido na resposta do cadastro não cria a sessão

- **WHEN** o cadastro inicial responde 201 com um token que não é um JWT estruturalmente válido ou já está expirado
- **THEN** a aplicação permanece em `/signup` com mensagem de erro, não armazena sessão e não navega para a página principal
