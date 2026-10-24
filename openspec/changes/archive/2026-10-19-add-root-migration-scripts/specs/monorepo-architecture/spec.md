# Spec Delta

## MODIFIED Requirements

### Requirement: Scripts orquestradores na raiz

A raiz SHALL expor scripts que orquestram toda a workspace: `pnpm dev` (sobes frontend e backend em paralelo após construir o shared), `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm format`, `pnpm migration:run` (aplica as migrations pendentes do backend) e `pnpm migration:revert` (reverte a última migration do backend), sem que o desenvolvedor precise entrar nos diretórios dos pacotes para o fluxo padrão.

#### Scenario: Desenvolvimento com um comando

- **WHEN** `pnpm dev` é executado na raiz
- **THEN** o shared é construído primeiro, e o dev server do frontend (`:4200`) e o do backend (`:3000`) rodam em paralelo

#### Scenario: Verificação completa

- **WHEN** `pnpm typecheck` é executado na raiz
- **THEN** todos os pacotes que definem o script `typecheck` são verificados

#### Scenario: Migrations aplicadas pela raiz

- **WHEN** `pnpm migration:run` é executado na raiz
- **THEN** as migrations pendentes do banco do backend são aplicadas, com o mesmo comportamento do script `migration:run` do `@monorepo/backend` (incluindo a mensagem "Nenhuma migration pendente." quando não há pendências)

#### Scenario: Reversão pela raiz

- **WHEN** `pnpm migration:revert` é executado na raiz
- **THEN** a última migration aplicada é revertida, com o mesmo comportamento do script `migration:revert` do `@monorepo/backend`, e o código de saída reflete falha caso a reversão não ocorra
