# Spec Delta

## ADDED Requirements

### Requirement: Toolbar de navegação na tela principal

A tela principal SHALL exibir, entre o banner e a área central, uma toolbar de navegação contendo os links Home, Admin e Help e o botão de login/logout, com o rótulo do botão conforme o estado da sessão (logout com sessão ativa, login sem sessão).

#### Scenario: Toolbar exibe os links de navegação

- **WHEN** a tela principal é renderizada
- **THEN** a toolbar exibe os links Home, Admin e Help

#### Scenario: Botão exibe rótulo de logout com sessão ativa

- **WHEN** a tela principal é renderizada com uma sessão ativa
- **THEN** o botão da toolbar exibe o rótulo de logout (Sair)

#### Scenario: Botão exibe rótulo de login sem sessão

- **WHEN** a tela principal é renderizada sem sessão ativa
- **THEN** o botão da toolbar exibe o rótulo de login (Entrar)
