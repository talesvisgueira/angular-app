# Spec Delta

## ADDED Requirements

### Requirement: Logout encerra a sessão

Quando o botão de logout da toolbar é acionado, a aplicação SHALL encerrar a sessão: remover o token e os dados do usuário, inclusive o espelho da sessão no armazenamento da aba, e navegar para a tela de login.

#### Scenario: Sessão removida após logout

- **WHEN** o usuário autenticado aciona o botão de logout (Sair) na toolbar
- **THEN** a sessão é removida e nenhum token ou dado de usuário permanece armazenado na aba

#### Scenario: Logout redireciona para o login

- **WHEN** o usuário autenticado aciona o botão de logout
- **THEN** a aplicação navega para a tela de login

#### Scenario: Refresh após logout não restaura a sessão

- **WHEN** a página é recarregada na mesma aba após o logout
- **THEN** nenhuma sessão é restaurada e a aplicação permanece na tela de login

### Requirement: Botão de login navega para a tela de login

Sem sessão ativa, a aplicação SHALL navegar para a tela de login quando o botão de login da toolbar for acionado.

#### Scenario: Clique no botão de login sem sessão

- **WHEN** o botão de login (Entrar) é acionado sem sessão ativa
- **THEN** a aplicação navega para a tela de login
