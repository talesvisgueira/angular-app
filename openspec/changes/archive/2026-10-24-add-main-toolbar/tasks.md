# Tasks

## 1. Páginas placeholder e rotas

- [x] 1.1 Gerar o componente `Admin` (`apps/frontend/src/app/admin/`) com conteúdo placeholder (título "Administração" e aviso "em construção") e spec Vitest de renderização; verificar com `pnpm --filter @monorepo/frontend test -- --include=src/app/admin/admin.spec.ts`
- [x] 1.2 Gerar o componente `Help` (`apps/frontend/src/app/help/`) com conteúdo placeholder (título "Ajuda" e aviso "em construção") e spec Vitest de renderização; verificar com `pnpm --filter @monorepo/frontend test -- --include=src/app/help/help.spec.ts`
- [x] 1.3 Registrar as rotas `/admin` e `/help` em `app.routes.ts` com `loadComponent` e `canActivate: [authGuard]`, e adicionar testes em `app.routes.spec.ts` cobrindo: rotas definidas e acesso sem sessão redireciona para `/login`; verificar com `pnpm --filter @monorepo/frontend test -- --include=src/app/app.routes.spec.ts`

## 2. Toolbar na página principal

- [x] 2.1 Gerar o componente `Toolbar` (`apps/frontend/src/app/main/toolbar/`) com `<nav>` semântico, links Home/Admin/Help via `RouterLink` (`/main`, `/admin`, `/help`) e botão com rótulo conforme `SessionStore.isAuthenticated()` ("Sair" autenticado, "Entrar" sem sessão); adicionar spec Vitest cobrindo os dois rótulos e a presença dos três links; verificar com `pnpm --filter @monorepo/frontend test -- --include=src/app/main/toolbar/toolbar.spec.ts`
- [x] 2.2 Implementar o logout no `Toolbar`: `sessionStore.clear()` seguido de navegação programática para `/login`, e o botão "Entrar" navegando para `/login` (routerLink); adicionar testes cobrindo que a sessão é removida e a navegação ocorre para `/login` nos dois casos; verificar com o spec da toolbar
- [x] 2.3 Renderizar `<app-toolbar>` no template da `Main` entre o banner e a área central (import standalone no `Main`) e ajustar `main.spec.ts` para cobrir a exibição da toolbar com links e botão; verificar com `pnpm --filter @monorepo/frontend test -- --include=src/app/main/main.spec.ts`

## 3. Verificação final

- [x] 3.1 Rodar a suíte completa do frontend (`pnpm test`) e confirmar que todos os specs passam
- [x] 3.2 Rodar `pnpm build` e `pnpm typecheck` a partir da raiz e confirmar ausência de erros de compilação/tipagem
- [x] 3.3 Smoke test manual com `pnpm dev`: logar, conferir a toolbar na página principal, navegar por Home/Admin/Help e validar que Sair encerra a sessão e volta para `/login`, e que `/admin` e `/help` diretos sem sessão redirecionam para o login

> 3.3 concluída com confirmação do usuário: a verificação interativa em navegador foi substituída pela cobertura automatizada (specs de rotas, toolbar e main + suíte completa 102/102 + checagem de boot dos servidores de dev), por falta de ferramenta de automação de navegador no ambiente.

## Workflow follow-up

- Após a revisão do projeto, arquivar a mudança (workflow `/opsx-archive`), sincronizando os deltas com as main specs `navigation`, `main-page` e `auth-session`.
