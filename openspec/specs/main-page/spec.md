# main-page Specification

## Purpose

Definir a composição e o comportamento da tela principal do sistema: banner com a identidade do sistema e do usuário autenticado, mensagem de boas-vindas central e rodapé com copyright e dados do autor.

## Requirements

### Requirement: Banner com identidade do sistema e usuário logado

A tela principal SHALL exibir, em um banner no topo, o nome do sistema, a logo do sistema e os dados do usuário autenticado (nome e e-mail provenientes da sessão ativa).

#### Scenario: Banner exibe nome do sistema

- **WHEN** a tela principal é renderizada
- **THEN** o banner exibe o nome do sistema definido pela aplicação

#### Scenario: Banner exibe a logo do sistema

- **WHEN** a tela principal é renderizada
- **THEN** o banner exibe a imagem da logo do sistema carregada dos assets da aplicação

#### Scenario: Banner exibe dados do usuário logado

- **WHEN** a tela principal é renderizada com uma sessão ativa
- **THEN** o banner exibe o nome e o e-mail do usuário autenticado correspondentes à sessão

### Requirement: Mensagem de boas-vindas central

A tela principal SHALL exibir, na área central, uma mensagem de boas-vindas personalizada com o nome do usuário autenticado.

#### Scenario: Mensagem de boas-vindas personalizada

- **WHEN** a tela principal é renderizada com uma sessão ativa
- **THEN** a área central exibe uma mensagem de boas-vindas que contém o nome do usuário autenticado

### Requirement: Rodapé com copyright e dados do autor

A tela principal SHALL exibir, em um rodapé, o copyright do sistema e os dados do autor.

#### Scenario: Rodapé exibe copyright

- **WHEN** a tela principal é renderizada
- **THEN** o rodapé exibe a linha de copyright do sistema

#### Scenario: Rodapé exibe dados do autor

- **WHEN** a tela principal é renderizada
- **THEN** o rodapé exibe os dados do autor definidos pela aplicação
