# Proposal

## Why

O repositório já opera como um monorepo pnpm (Angular 22 + Fastify + pacote compartilhado), mas a arquitetura existe apenas na prática — não há requisitos formais que definam a estrutura de workspaces, a gestão de dependências e as convenções de build/dev. Sem esse contrato, mudanças futuras podem quebrar invariantes (ordem de build do `shared`, pin do pnpm, proxy de `/api`) sem que ninguém perceba.

## What Changes

- Formaliza, como spec, a arquitetura de monorepo já implementada: estrutura `apps/*` + `packages/*` gerenciada por pnpm workspaces.
- Define requisitos para a organização dos pacotes (`@monorepo/frontend`, `@monorepo/backend`, `@monorepo/shared`) e o consumo interno via `workspace:*`.
- Define requisitos para os scripts orquestradores na raiz (`dev`, `build`, `typecheck`, `test`, `format`), incluindo a garantia de que `shared` é construído antes dos apps.
- Define requisitos para o gerenciamento de versões: `packageManager` fixando o pnpm, `engines` fixando Node >= 22, e a lista `allowBuilds` do `pnpm-workspace.yaml`.
- Define requisitos para a integração frontend ↔ backend em desenvolvimento (proxy `/api` → `:3000`).
- Nenhuma mudança de código é necessária: a implementação atual já satisfaz os requisitos propostos; a mudança documenta e fixa o contrato.

## Capabilities

### New Capabilities

- `monorepo-architecture`: Estrutura de workspaces pnpm, organização e dependências entre pacotes, scripts orquestradores da raiz, pin de toolchain (pnpm/Node) e integração dev frontend↔backend.

### Modified Capabilities

(nenhuma — não há specs existentes)

## Impact

- **Specs**: cria `openspec/specs/monorepo-architecture/spec.md`.
- **Código**: nenhum obrigatório; validação de conformidade pode revelar ajustes pontuais em `package.json`/`pnpm-workspace.yaml` (não esperados — a auditoria inicial indica conformidade).
- **Risco**: baixo. A mudança é de especificação; comportamento observável do sistema não muda.
