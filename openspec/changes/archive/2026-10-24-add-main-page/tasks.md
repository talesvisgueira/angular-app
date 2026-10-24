# Tasks

## 1. Sessão no frontend (base)

- [x] 1.1 Criar `SessionStore` em `apps/frontend/src/app/session/` (service standalone com `signal<LoginResponse | null>`): métodos `set(response)`, `clear()`, `user()`, `isAuthenticated()`; persistir em `sessionStorage` (chave `app.session`) e rehidratar na construção, com `try/catch` e fallback para memória. Verificar com unit test: `set` persiste, nova instância rehidrata, storage indisponível não quebra.
- [x] 1.2 Criar guarda funcional `authGuard` (`CanActivateFn`) em `apps/frontend/src/app/session/`: sem sessão → redireciona para `/login`; com sessão → permite. Verificar com unit test dos dois caminhos.

## 2. Rotas e extração do login

- [x] 2.1 Criar componente `Login` standalone em `apps/frontend/src/app/login/` (via `pnpm --filter @monorepo/frontend exec ng generate component login`), movendo o formulário de `app.ts`/`app.html` 1:1 (mesmos controles, validadores e mensagens). No sucesso: `sessionStore.set(response)` + `router.navigate(['/main'])` (removendo o fluxo `submitted`/mensagem de sucesso); falha 400/401 mantém a mensagem de erro atual. Verificar com `login.spec.ts`: testes do formulário migrados, sucesso navega para `/main` e grava a sessão, 401 permanece no login sem sessão.
- [x] 2.2 Simplificar `App` (`app.ts`/`app.html`/`app.scss`) para shell apenas com `<router-outlet/>`, movendo os estilos do login para `login.scss`; atualizar `app.spec.ts` (shell renderiza outlet, sem formulário). Verificar com `pnpm --filter @monorepo/frontend test -- --filter 'App'`.
- [x] 2.3 Definir rotas em `app.routes.ts`: `/login` → `Login`, `/main` → `Main` (lazy) com `canActivate: [authGuard]`, `''` → `redirectTo: 'main'`. Verificar com teste de navegação: `''` sem sessão termina em `/login`; `''` com sessão semeada termina em `/main`.

## 3. Tela principal

- [x] 3.1 Criar assets/identidade: `apps/frontend/public/logo.svg` (placeholder) e constantes em `apps/frontend/src/app/app-info.ts` (`SYSTEM_NAME = 'AngularApp'`, copyright, dados do autor placeholder). Verificar que os arquivos existem e que a logo é servida em `/logo.svg` pelo dev server.
- [x] 3.2 Criar componente `Main` standalone em `apps/frontend/src/app/main/` (via `ng generate component main`): banner com logo (`/logo.svg`), `SYSTEM_NAME` e nome/e-mail de `sessionStore.user()`; mensagem de boas-vindas central personalizada com o nome do usuário; rodapé com copyright e dados do autor; estilos em `main.scss` (banner no topo, conteúdo central flex, rodapé fixo ao fim). Verificar com `main.spec.ts` (sessão semeada no store): banner exibe nome do sistema, logo e usuário; boas-vindas contém o nome; rodapé exibe copyright e autor.

## 4. Verificação integrada

- [x] 4.1 Rodar `pnpm test` na raiz e confirmar que todos os specs do frontend passam (Vitest/jsdom).
- [x] 4.2 Rodar `pnpm typecheck` e `pnpm build` na raiz e confirmar que não há erros.
- [x] 4.3 Verificação manual com `pnpm dev`: login com credencial válida (`password123`) redireciona para `/main` exibindo banner, boas-vindas e rodapé; acesso direto a `/main` sem sessão volta ao login; F5 em `/main` mantém os dados do usuário no banner.

## Workflow follow-up

- Após revisão e implementação, arquivar o change (`openspec archive`) conforme o fluxo do projeto.
