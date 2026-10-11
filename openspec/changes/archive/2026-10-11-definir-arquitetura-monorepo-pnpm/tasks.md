# Tasks

## 1. Auditoria de conformidade da arquitetura

- [x] 1.1 Verificar a estrutura de workspaces: confirmar que `pnpm-workspace.yaml` declara `apps/*` e `packages/*` e que os três pacotes têm nomes `@monorepo/*` únicos (inspeção + `pnpm ls -r --depth -1`) — cenário "Instalação cobre todos os pacotes" da spec
- [x] 1.2 Verificar dependências internas: confirmar que `apps/backend/package.json` e `apps/frontend/package.json` declaram `@monorepo/shared` como `workspace:*` e que não há imports relativos entre pacotes (`rg "@monorepo/shared" apps/` + busca por `from '\.\./\.\.` cruzando pacotes) — cenário "App consome pacote compartilhado"
- [x] 1.3 Verificar toolchain: confirmar `packageManager` (pnpm 12.x) e `engines.node` >= 22 na raiz — cenário "Ambiente reproduzível"

## 2. Verificação comportamental com comandos existentes

- [x] 2.1 Em um estado sem `dist/` (remover `packages/shared/dist` e `apps/backend/dist`), executar `pnpm build` e confirmar que `shared` é gerado antes dos apps sem erro — cenários "Build limpo a partir do clone" e "Build filtrado individual"
- [x] 2.2 Executar `pnpm dev` e confirmar que o shared é construído primeiro e que frontend (:4200) e backend (:3000) sobem em paralelo; encerrar com Ctrl+C — cenário "Desenvolvimento com um comando"
- [x] 2.3 Com o dev server rodando, chamar `POST http://localhost:4200/api/auth/login` (ex. curl do README) e confirmar o encaminhamento ao :3000 — cenário "Chamada relativa ao origin do frontend"
- [x] 2.4 Executar `pnpm typecheck` e `pnpm test` na raiz e confirmar que todos os pacotes com os scripts são verificados/testados — cenário "Verificação completa"
- [x] 2.5 Confirmar que `pnpm install` em checkout limpo não falha por scripts bloqueados (esbuild/lmdb/@parcel/watcher/msgpackr-extract em `allowBuilds`) e que o build do frontend/Vitest funciona — cenário "Build de frontend funciona após instalação limpa"

## 3. Correção de desvios (somente se a auditoria revelar)

- [x] 3.1 Se algum item do grupo 1 ou 2 divergir da spec, corrigir o config mínimo (`package.json`/`pnpm-workspace.yaml`) e reexecutar a verificação correspondente; se o desvio for intencional, atualizar a spec delta antes de prosseguir e registrar a decisão

## 4. Fechamento da especificação

- [x] 4.1 Atualizar `AGENTS.md`/`README.md` apenas se a auditoria mudar algum fato documentado (esperado: nenhuma mudança) — verificação: comandos documentados continuam corretos
- [x] 4.2 Rodar `openspec validate --change definir-arquitetura-monorepo-pnpm --strict` e corrigir eventuais problemas de formato da delta

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result.
