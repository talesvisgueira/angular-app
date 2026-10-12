# monorepo-architecture Specification

## Purpose

Define o contrato da arquitetura de monorepo gerenciada por pnpm workspaces: estrutura de pacotes, dependências internas, ordem de build, orquestração de scripts na raiz e integração de desenvolvimento entre frontend e backend.

## Requirements

### Requirement: Estrutura de workspaces pnpm

O repositório SHALL declarar seus pacotes em `pnpm-workspace.yaml` usando os globs `apps/*` e `packages/*`, e cada pacote SHALL ser identificável por um nome único no escopo `@monorepo/*`.

#### Scenario: Instalação cobre todos os pacotes

- **WHEN** `pnpm install` é executado na raiz
- **THEN** as dependências de `apps/frontend`, `apps/backend` e `packages/shared` são resolvidas e instaladas em um único lockfile na raiz

#### Scenario: Pacote novo herda a workspace

- **WHEN** um novo diretório é criado em `apps/` ou `packages/` com um `package.json` válido
- **THEN** ele é reconhecido como membro da workspace sem alterar `pnpm-workspace.yaml`

### Requirement: Dependências internas via workspace protocol

Qualquer pacote da workspace que dependa de outro pacote da workspace SHALL declarar a dependência usando o protocolo `workspace:*` e SHALL ser capaz de importá-la pelo nome do pacote (`@monorepo/shared`), nunca por caminho relativo entre pacotes.

#### Scenario: App consome pacote compartilhado

- **WHEN** o frontend ou o backend importa `@monorepo/shared`
- **THEN** a importação resolve para o pacote da workspace linkado pelo pnpm, sem caminhos relativos que atravessem a raiz do pacote

### Requirement: Toolchain fixada na raiz

A raiz SHALL fixar a versão do gerenciador de pacotes no campo `packageManager` (pnpm 12.x) e SHALL declarar `engines.node` >= 22, de modo que `corepack enable && pnpm install` reproduza o ambiente em qualquer máquina.

#### Scenario: Ambiente reproduzível

- **WHEN** um colaborador clona o repositório, executa `corepack enable` e `pnpm install`
- **THEN** o pnpm na versão declarada em `packageManager` é usado e a instalação falha (ou é bloqueada) se o Node ativo não satisfizer `engines.node`

### Requirement: Ordem topológica de build com shared primeiro

O comando de build da raiz SHALL construir os pacotes em ordem topológica, garantindo que `@monorepo/shared` seja construído antes de qualquer app que o dependa, porque os `exports` do shared apontam para `dist/`.

#### Scenario: Build limpo a partir do clone

- **WHEN** `pnpm build` é executado em um checkout sem nenhum `dist/` pré-existente
- **THEN** `packages/shared/dist` é gerado antes de o backend e o frontend serem construídos, e o build dos apps não falha por falta dos artefatos do shared

#### Scenario: Build filtrado individual

- **WHEN** um app é construído isoladamente (ex.: `pnpm --filter @monorepo/backend build`) sem o shared previamente construído
- **THEN** o operador sabe (documentação/scripts) que precisa construir o shared antes, pois o app não reconstrói dependências automaticamente

### Requirement: Scripts orquestradores na raiz

A raiz SHALL expor scripts que orquestram toda a workspace: `pnpm dev` (sobes frontend e backend em paralelo após construir o shared), `pnpm build`, `pnpm typecheck`, `pnpm test` e `pnpm format`, sem que o desenvolvedor precise entrar nos diretórios dos pacotes para o fluxo padrão.

#### Scenario: Desenvolvimento com um comando

- **WHEN** `pnpm dev` é executado na raiz
- **THEN** o shared é construído primeiro, e o dev server do frontend (`:4200`) e o do backend (`:3000`) rodam em paralelo

#### Scenario: Verificação completa

- **WHEN** `pnpm typecheck` é executado na raiz
- **THEN** todos os pacotes que definem o script `typecheck` são verificados

### Requirement: Proxy de API em desenvolvimento

Em desenvolvimento, o dev server do frontend SHALL encaminhar requisições para `/api` ao backend local em `http://localhost:3000`, de forma que o frontend chame a API por caminhos relativos sem conhecer a origem do backend.

#### Scenario: Chamada relativa ao origin do frontend

- **WHEN** o frontend em `:4200` faz uma requisição para `/api/auth/login`
- **THEN** a requisição é encaminhada ao backend em `:3000` e a resposta volta ao frontend como se fosse local

### Requirement: Controle de scripts de pós-instalação

O `pnpm-workspace.yaml` SHALL manter sob `allowBuilds` somente os pacotes cujos scripts de build nativo são necessários ao funcionamento do build (Angular/Vitest), evitando que o pnpm 12 bloqueie ou execute arbitrariamente scripts de dependências.

#### Scenario: Build de frontend funciona após instalação limpa

- **WHEN** `pnpm install` é executado em um checkout limpo, seguido de `pnpm build`
- **THEN** os pacotes listados em `allowBuilds` (esbuild e afins) têm seus scripts de build nativo executados e o build do frontend/Vitest funciona sem erros de binário ausente
