# Design

## Context

O frontend hoje tem um único componente: `App` (`apps/frontend/src/app/`), que é ao mesmo tempo o shell e a tela de login. `app.routes.ts` está vazio e `RouterOutlet` já está importado/renderizado em `app.html`. Após `POST /api/auth/login` com sucesso, a resposta `LoginResponse` (`token`, `user.id/name/email`) é descartada. Não há logo em `apps/frontend/public/` (apenas `favicon.ico`). Ver proposta para motivação e os deltas `specs/main-page` e `specs/auth-session` para os requisitos.

## Goals / Non-Goals

**Goals:**

- Estruturar o frontend em rotas reais: login em `/login`, página principal em `/main`.
- Sessão no frontend que sobreviva a refresh dentro da mesma aba.
- Guarda de rota simples para acesso não autenticado a `/main`.
- Layout da página principal (banner, boas-vindas, rodapé) sem bibliotecas de UI novas.

**Non-Goals:**

- Validação de token no backend ou endpoint de refresh/logout na API (a spec `user-authentication` não muda).
- Interceptor HTTP de autenticação anexando o token às chamadas.
- Logout, controle de papéis (RBAC) ou telas adicionais.
- Identidade visual definitiva: logo e nome do autor são placeholders.

## Decisions

### 1. Rotas: login extraído para `/login`, principal em `/main`, `''` redireciona para `/main`

`App` passa a ser apenas shell com `<router-outlet/>`; o formulário atual migra intacto (mesmos controles, validações e mensagens) para um componente `Login` standalone em `src/app/login/` e a nova tela em `src/app/main/`.

- _Alternativa descartada_: manter o login em `App` e alternar telas por `@if` — replicaria manualmente o que o Router já dá (URLs, guarda, navegação) e `RouterOutlet` já está presente.
- `''` → `redirectTo: 'main'` + guarda cobre o cenário "abrir o app" exigido pela spec `auth-session`.

### 2. Sessão: `SessionStore` com signals + `sessionStorage`

Service standalone `SessionStore` (em `src/app/session/`) com `signal<Session | null>` (`Session = LoginResponse`). No sucesso do login: `set(response)` grava em `sessionStorage` (chave única, ex. `app.session`); na construção, rehidrata do storage. Acesso à tela principal somente via métodos do store (`user()`, `isAuthenticated()`).

- _Por que `sessionStorage` e não `localStorage`_: o requisito é persistir durante a aba (refresh); `localStorage` estenderia a sessão para outras abas e após fechar o navegador, aumentando a exposição do token demo sem necessidade.
- _Por que signals e não RxJS/NgRx_: o projeto já usa signals (`App`), o estado é pequeno e local; libs de estado seriam overkill.
- Leitura/gravação do storage em `try/catch` com fallback para memória (modo privado/storage indisponível não podem quebrar o app).

### 3. Guarda funcional simples, sem validação de token

`CanActivateFn` lê o `SessionStore`: com sessão → permite; sem sessão → `router.createUrlTree(['/login'])`. A API não expõe endpoint de validação de token, então a guarda confia na sessão local — coerente com o escopo demo (`demo-token-...`).

- _Alternativa descartada_: guarda que chama a API para validar o token — não há endpoint na spec `user-authentication`; exigiria mudança de backend, fora de escopo.

### 4. Constantes de identidade em arquivo único

`SYSTEM_NAME` ("AngularApp", igual ao `title` de `index.html`), autor/copyright e caminho da logo (`/logo.svg`) ficam em um módulo único (ex. `src/app/app-info.ts`), consumido pela tela principal — um só lugar para trocar quando chegarem a logo e o autor reais.

### 5. Testes reestruturados no mesmo change

Vitest (jsdom, globals ativos): `app.spec.ts` passa a testar só o shell; novo `login.spec.ts` herda os testes do formulário atual e ganha cenário de navegação (sucesso → `/main`; 401 → permanece); novo `main.spec.ts` valida banner (nome, logo, usuário), boas-vindas e rodapé com sessão semeada; specs para o store (set/persistência/rehidratação) e para a guarda (com/sem sessão). Testes com HTTP usam `provideHttpClientTesting` (convenção já documentada no AGENTS.md).

## Risks / Trade-offs

- **Token demo sem validação**: sessão rehidratada de `sessionStorage` não prova validade no backend → aceito no escopo demo; mitigação futura natural é um interceptor + endpoint de validação (fora de escopo).
- **`sessionStorage` indisponível** (modo privado/política restritiva) → `try/catch` com fallback para memória: o fluxo funciona, só perde o refresh.
- **Regressão no login existente** (testes de `app.spec.ts` quebram com a extração) → migração do formulário é 1:1 e os testes do formulário migram junto no mesmo change.
- **Placeholders visíveis ao usuário** (logo/autor genéricos) → isolados em constante + arquivo de asset; troca é mecânica e não afeta specs.

## Migration Plan

Sem migração de dados ou deploy especial: change contido no frontend. Rollback = reverter o commit; a rota antiga (login na raiz) volta a funcionar pois o backend não muda.

## Open Questions

- Nome real do autor/organização para o rodapé e arte final da logo — placeholders definidos; substituição não altera specs nem tarefas.
