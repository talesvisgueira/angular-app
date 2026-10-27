# Design

## Context

O backend já possui o fluxo de migrations implementado e estável: `apps/backend/src/database/data-source-cli.ts` (comandos `run`/`revert` via tsx) e os scripts `migration:run`/`migration:revert` em `apps/backend/package.json`. A raiz (`package.json`) orquestra a workspace por delegação via `pnpm --filter` (padrão já usado por `dev`, `dev:frontend`, `dev:backend`). O AGENTS.md documenta os comandos da raiz como convenção do projeto. Ver proposal.md para a motivação.

## Goals / Non-Goals

**Goals:**

- Executar `pnpm migration:run` e `pnpm migration:revert` da raiz, com comportamento idêntico aos scripts do backend (mesmos códigos de saída, mesma saída no console).
- Documentar os novos comandos no AGENTS.md, na seção Commands.

**Non-Goals:**

- Novos comandos de migration (ex.: `migration:show`, `migration:generate`) — o CLI do backend só suporta `run`/`revert` hoje.
- Alterar o CLI, o `DataSource` ou as migrations existentes.
- Corrigir a limitação pré-existente de clone fresco (ausência de `apps/backend/data/`, que faz `ensureDatabaseDirectory` falhar) — afeta igualmente `pnpm dev:backend` e será tratada à parte, se necessário.

## Decisions

- **Delegação via `pnpm --filter`**: os scripts da raiz usam `pnpm --filter @monorepo/backend migration:run|revert`.
  - _Por quê_: é o padrão já estabelecido na raiz (`dev:frontend`, `dev:backend`); o pnpm resolve o binário/bibliotecas no contexto do pacote alvo, sem `cd` embutido no script.
  - _Alternativas consideradas_: `pnpm -C apps/backend migration:run` (equivalente, mas diverge do estilo existente) e duplicar a linha `tsx -r reflect-metadata ...` na raiz (rejeitado: duplica a implementação e acopla a raiz aos detalhes do CLI).
- **Nomes dos scripts na raiz = nomes no backend** (`migration:run`, `migration:revert`): evita dois vocabulários para a mesma ação e mantém a saída de `pnpm run` previsível em qualquer diretório.
- **Documentação no AGENTS.md** como parte da mudança: o AGENTS.md é a fonte de convenções de comandos; um script raiz sem lá estar documentado viola a própria convenção que o motivou.

## Risks / Trade-offs

- [Clone fresco sem `apps/backend/data/` falha com erro do `ensureDatabaseDirectory`] → Mitigação: registrar a limitação na documentação da mudança; comportamento é idêntico ao dos scripts existentes do backend (nenhum regresso). Correção do `data/` fica como mudança futura separada.
- [Delegação adiciona uma camada de indireção para debug] → Mitigação: o erro do `--filter` aponta o script real do backend; a mensagem de uso do CLI continua sendo exibida nos dois níveis.
- [Revert de `AddCrudApiFoundation` falha com dados no banco (`SQLITE_CONSTRAINT_FOREIGNKEY`)] → Limitação pré-existente descoberta durante a verificação (fora do escopo desta mudança): o `down()` cria tabelas `_temp` com FKs apontando para as tabelas originais e derruba as originais com dados presentes; a checagem adiada falha no COMMIT. Comportamento idêntico executando o script do backend diretamente (nenhum regresso desta mudança); o rollback protegeu o banco de dev, que permaneceu íntegro. Task 2.2 verificada em banco descartável via `DB_PATH` (ciclo run→revert→run: 3→2→3 migrations). Correção proposta como mudança futura separada (ex.: `fix-crud-foundation-revert`).

## Open Questions

(nenhuma)
