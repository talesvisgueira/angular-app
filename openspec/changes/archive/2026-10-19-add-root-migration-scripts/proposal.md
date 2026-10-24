# Proposal

## Why

As migrations do backend já podem ser executadas via `apps/backend/package.json` (`migration:run` / `migration:revert`), mas a raiz do monorepo não as orquestra. A convenção do projeto (AGENTS.md) é que o fluxo padrão rode da raiz (`pnpm dev`, `pnpm build`, `pnpm test`, `pnpm typecheck`), e hoje executar migrations exige `cd apps/backend` ou `pnpm --filter @monorepo-backend ...` manualmente — o que quebra a convenção, dificulta onboarding e automação (CI) e é fácil de esquecer depois de criar uma nova migration.

## What Changes

- Adicionar scripts orquestradores na raiz (`package.json`): `migration:run` e `migration:revert`, que delegam aos scripts existentes do `@monorepo/backend` via `pnpm --filter`.
- Atualizar `AGENTS.md` (seção Commands) para documentar os novos comandos da raiz.
- Nenhuma mudança no CLI de migrations (`data-source-cli.ts`), nas migrations existentes nem no comportamento do backend em runtime.

Premissas registradas:

- O pedido "criar um script no package.json para rodar as migrations" se refere ao **package.json da raiz**: o backend já possui os scripts de migration, e a lacuna real é a orquestração na raiz (mesmo padrão dos demais comandos documentados no AGENTS.md).
- Escopo mantido em `run` e `revert`, espelhando exatamente o que o CLI do backend suporta hoje (nenhum novo comando como `migration:show`).

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `monorepo-architecture`: o requisito "Scripts orquestradores na raiz" passa a incluir a orquestração de migrations — `pnpm migration:run` e `pnpm migration:revert` executáveis a partir da raiz, sem entrar no diretório do backend.

## Impact

- **Código**: apenas `package.json` da raiz (+2 scripts) e documentação (`AGENTS.md`).
- **APIs / dependências**: nenhuma alteração; nenhum pacote novo.
- **Backend**: scripts existentes em `apps/backend/package.json` permanecem como implementação real; comportamento em runtime inalterado.
- **Observação fora de escopo**: em um clone fresco, `apps/backend/data/` não existe (gitignored) e `ensureDatabaseDirectory` falha antes de qualquer migration — limitação pré-existente também do `pnpm dev:backend`, não introduzida nem resolvida por esta mudança.
