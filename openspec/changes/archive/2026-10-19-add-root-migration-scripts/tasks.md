# Tasks

## 1. Scripts orquestradores na raiz

- [x] 1.1 Adicionar `"migration:run": "pnpm --filter @monorepo/backend migration:run"` e `"migration:revert": "pnpm --filter @monorepo/backend migration:revert"` aos `scripts` do `package.json` da raiz e verificar que `pnpm run` (na raiz) lista ambos
- [x] 1.2 Documentar os novos comandos na seção **Commands** do `AGENTS.md` e verificar que os comandos documentados correspondem exatamente aos nomes dos scripts adicionados
- [x] 1.3 Verificar conformidade com Prettier dos arquivos editados (`pnpm exec prettier --check package.json`)

## 2. Verificação de comportamento

- [x] 2.1 Com `apps/backend/data/` presente, executar `pnpm migration:run` na raiz e verificar exit code 0 e saída idêntica à do script do backend (lista de migrations aplicadas ou "Nenhuma migration pendente.")
- [x] 2.2 Executar `pnpm migration:revert` na raiz e verificar a mensagem "Última migration revertida."; em seguida executar `pnpm migration:run` novamente para restaurar o estado e confirmar que a migration reaplica

## 3. Validação

- [x] 3.1 Executar `openspec validate` para a change `add-root-migration-scripts` e confirmar que o delta de `monorepo-architecture` passa sem erros

## Workflow follow-up

- Arquivar a change após a revisão do projeto ser concluída (`/opsx-archive`).
