# Spec Delta

## Purpose

Definir os destinos de navegação do sistema a partir da toolbar da página principal: retorno à página principal, acesso às páginas de administração e de ajuda (conteúdo placeholder) e proteção por autenticação desses destinos.

## ADDED Requirements

### Requirement: Link Home retorna à página principal

A aplicação SHALL navegar para a página principal (`/main`) quando o link Home da toolbar for acionado.

#### Scenario: Clique no link Home

- **WHEN** o usuário autenticado aciona o link Home na toolbar da página principal
- **THEN** a aplicação permanece/navega para a página principal (`/main`)

### Requirement: Link Admin abre a página de administração

A aplicação SHALL navegar para a página de administração (`/admin`) quando o link Admin da toolbar for acionado, exibindo a página placeholder de administração.

#### Scenario: Clique no link Admin

- **WHEN** o usuário autenticado aciona o link Admin na toolbar
- **THEN** a aplicação navega para `/admin` e exibe a página placeholder de administração

### Requirement: Link Help abre a página de ajuda

A aplicação SHALL navegar para a página de ajuda (`/help`) quando o link Help da toolbar for acionado, exibindo a página placeholder de ajuda.

#### Scenario: Clique no link Help

- **WHEN** o usuário autenticado aciona o link Help na toolbar
- **THEN** a aplicação navega para `/help` e exibe a página placeholder de ajuda

### Requirement: Destinos admin e help são protegidos por autenticação

A aplicação SHALL redirecionar para a tela de login qualquer acesso às páginas `/admin` e `/help` sem sessão ativa, da mesma forma que a página principal.

#### Scenario: Página admin sem sessão

- **WHEN** a página `/admin` é acessada diretamente sem sessão ativa
- **THEN** a aplicação redireciona para a tela de login

#### Scenario: Página help sem sessão

- **WHEN** a página `/help` é acessada diretamente sem sessão ativa
- **THEN** a aplicação redireciona para a tela de login
