# Design

## Context

O monorepo pnpm já está implementado e funcional (ver `AGENTS.md` e `README.md`): `pnpm-workspace.yaml` com `apps/*` + `packages/*`, `packageManager: pnpm@12.10.1`, scripts orquestradores na raiz, `@monorepo/shared` consumido via `workspace:*` com `exports` apontando para `dist/`, e proxy `/api` no dev server do Angular. A motivação está em proposal.md (Why); esta mudança é de especificação, não de implementação.

## Goals / Non-Goals

**Goals:**

- Capturar a arquitetura atual como requisitos testáveis em `openspec/specs/monorepo-architecture/`.
- Tornar auditável o que "conformidade com a arquitetura" significa (cada cenário da spec é verificável por comando ou inspeção de config).
- Corrigir, somente se a auditoria de conformidade revelar desvios, ajustes pontuais de configuração — sem mudar comportamento observável.

**Non-Goals:**

- Reestruturar diretórios, renomear pacotes ou trocar o gerenciador de pacotes.
- Adicionar novas ferramentas (Nx, Turborepo, lint) ou pipelines de CI.
- Mudar comportamento da aplicação (API, UI, auth).
- Especificar o conteúdo das rotas do backend ou componentes do frontend.

## Decisions

1. **Capacidade única e coesa (`monorepo-architecture`) em vez de várias speclets** — os requisitos (workspace, build order, toolchain, proxy) descrevem um mesmo sistema: a organização do repositório. Alternativa descartada: specs separadas por pacote (`frontend-build`, `backend-build`), que fragmentariam contratos que hoje são interdependentes (o requisito de build order cruza os três pacotes).

2. **Spec de conformidade (status quo formalizado), não de mudança de comportamento** — os requisitos descrevem o que já funciona; cenários são validáveis com comandos existentes (`pnpm install`, `pnpm build`, `pnpm dev`, `pnpm typecheck`). Alternativa descartada: usar `skip_specs: true` e apenas documentar em markdown — rejeitada porque exigências de arquitetura precisam de cenários verificáveis para sobreviver a refactors futuros.

3. **Requisitos evitam nomes de ferramenta interna onde possível** — a spec fala em "dev server do frontend" e "backend local", não em `ng serve`/`tsx watch`; detalhes de implementação ficam em `AGENTS.md`. Exceções conscientes: `pnpm`, `workspace:*`, `packageManager` e `allowBuilds` são o contrato do gerenciador de pacotes em si, então entram na spec.

4. **`allowBuilds` como requisito de manutenção, não lista fechada** — a spec exige que a lista contenha o necessário ao build e evite scripts arbitrários, sem congelar os nomes atuais; pnpm pode mudar o conjunto necessário.

## Risks / Trade-offs

- [Spec dorme e nunca é consultada] → Cada cenário traz o comando de verificação embutido; o apply inclui executá-los uma vez para provar conformidade, o que valida a spec contra a realidade.
- [pnpm 12 muda semântica de `allowBuilds`/`packageManager` em upgrade] → O requisito descreve o efeito observável (scripts nativos executados sob controle), não a sintaxe; upgrade futuro vira delta MODIFIED explícito.
- [Falso senso de segurança: spec não impede violações automaticamente] → Aceito por ora; automação (CI, hooks) está fora de escopo e pode virar mudança futura.
- [Auditoria revelar desvio real] → O apply corrige o config mínimo ou registra o desvio comoquestão aberta ao usuário; nada na spec força mudança de comportamento.

## Migration Plan

Não há migração: nenhum código muda no caminho feliz. Rollback trivial (reverter arquivos de spec). Se a auditoria encontrar desvio, a correção é pontual em `package.json`/`pnpm-workspace.yaml` e reversível pelo git.

## Open Questions

Nenhuma.
