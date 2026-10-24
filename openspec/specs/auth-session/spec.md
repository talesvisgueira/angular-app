# auth-session Specification

## Purpose

Definir o fluxo de sessão no frontend: armazenamento da sessão após um login bem-sucedido, redirecionamento do login para a página principal, persistência da sessão durante a aba e redirecionamento de acessos não autenticados.

## Requirements

### Requirement: Redirecionamento do login para a página principal

Após um login bem-sucedido (resposta 200 de `POST /api/auth/login`), a aplicação SHALL armazenar a sessão retornada (`token` e `user`) e navegar para a página principal.

#### Scenario: Login válido navega para a página principal

- **WHEN** o login é enviado com credenciais válidas e a API responde 200
- **THEN** a aplicação navega para a página principal

#### Scenario: Sessão armazenada após login

- **WHEN** o login é autenticado com sucesso
- **THEN** a aplicação armazena o token e os dados do usuário (`id`, `name`, `email`) retornados na resposta

### Requirement: Falha de login permanece na tela de login

Quando o login falha (respostas 400 ou 401 de `POST /api/auth/login`), a aplicação SHALL permanecer na tela de login, exibir a mensagem de erro e NÃO navegar para a página principal nem armazenar sessão.

#### Scenario: Credenciais inválidas permanecem no login

- **WHEN** o login é enviado com credenciais inválidas e a API responde 401
- **THEN** a aplicação permanece na tela de login, exibe a mensagem de erro e nenhuma sessão é armazenada

### Requirement: Sessão persiste durante a aba

A aplicação SHALL manter a sessão ativa durante a mesma aba do navegador, de forma que recarregar a página principal mantenha o usuário autenticado e seus dados visíveis no banner.

#### Scenario: Refresh mantém a sessão

- **WHEN** a página principal é recarregada na mesma aba com uma sessão ativa
- **THEN** a tela principal é exibida novamente com os dados do usuário autenticado no banner

### Requirement: Acesso não autenticado redireciona para o login

A aplicação SHALL redirecionar para a tela de login qualquer acesso à página principal sem sessão ativa.

#### Scenario: Página principal sem sessão

- **WHEN** a página principal é acessada diretamente sem sessão ativa
- **THEN** a aplicação redireciona para a tela de login

#### Scenario: Rota inicial

- **WHEN** a aplicação é aberta na rota vazia
- **THEN** a aplicação redireciona para a página principal, que por sua vez redireciona para o login quando não há sessão ativa
