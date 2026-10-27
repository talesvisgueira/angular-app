# Design

## Context

O frontend (Angular 22, standalone components + signals) tem duas rotas: `/login` e `/main` (protegida por `authGuard`). `SessionStore` já expõe `isAuthenticated()` (signal computado) e `clear()` (remove a sessão em memória e o espelho em `sessionStorage`), mas `clear()` ainda não tem chamador. A tela principal compõe banner, área central e rodapé, sem navegação. Ver `proposal.md` para a motivação.

## Goals / Non-Goals

**Goals:**

- Toolbar navegável na tela principal com links Home, Admin, Help e botão login/logout.
- Rotas `/admin` e `/help` com páginas placeholder, protegidas pelo mesmo guard da página principal.
- Logout funcional: sessão encerrada localmente e redirecionamento para `/login`.

**Non-Goals:**

- Implementar o CRUD administrativo (capability `admin-crud-api` cobre o backend; a UI real é uma mudança futura).
- Página de ajuda definitiva (conteúdo placeholder).
- Endpoint de logout no backend (a sessão é local; não há invalidação server-side nesta mudança).
- Toolbar nas páginas admin/help (escopo desta mudança é a toolbar na página principal).

## Decisions

1. **Toolbar como componente separado (`main/toolbar`), renderizada no template da `Main`.** A `Main` injeta `SessionStore` e `Router` e passa o estado; ou a própria toolbar injeta o que precisa. Alternativa considerada: markup inline no `main.html`. Escolhida a componente separada porque isola navegação/sessão da composição da página e facilita reuso futuro (ex.: toolbar em admin/help). Segue o padrão do projeto: standalone, sem sufixo `.component`, arquivos `toolbar.ts/html/scss`.

2. **Navegação dos links com `RouterLink` (declarativa); logout com `Router.navigate` (programática).** Links são navegação pura e ganham semântica de âncora/URL de graça; o botão Entrar usa `routerLink="/login"`. O Sair precisa limpar a sessão **antes** de navegar, então é handler programático: `sessionStore.clear()` + `void router.navigate(['/login'])`. Alternativa considerada: `(click)` para tudo — rejeitada por perder a semântica de link.

3. **Rótulo do botão via `sessionStore.isAuthenticated()`.** O componente exibe "Sair" quando autenticado e "Entrar" caso contrário, com `@if` sobre o signal computado existente. Nenhum estado novo é criado — evita duplicar a fonte de verdade da sessão.

4. **Páginas placeholder `Admin` e `Help` como componentes mínimos com rota lazy (`loadComponent`) e `canActivate: [authGuard]`.** Espelha o padrão das rotas existentes em `app.routes.ts` (componentes standalone carregados sob demanda, guard reutilizado em vez de duplicar a checagem de sessão). Os placeholders exibem um título e um aviso de "em construção", deixando explícito que são provisórios.

5. **`<nav>` semântico em vez de padrão ARIA Toolbar.** A referência Angular ARIA (padrão toolbar com roving tabindex) visa widgets compostos interativos; aqui são apenas três links e um botão, e um `<nav>` com âncoras reais já é acessível e mais simples. Sem dependências novas.

6. **Testes com Vitest (padrão do repositório), sem Karma/Jasmine.** Cobertura: rótulo do botão por estado de sessão e navegação no spec da toolbar; rotas `/admin` e `/help` no spec de rotas existente (`app.routes.spec.ts`); renderização dos placeholders; navegação pós-logout. Specs de componentes fornecem os providers necessários (`provideHttpClient`/`provideHttpClientTesting` quando `HttpClient` for injetado na árvore; `Router` via `provideRouter`).

## Risks / Trade-offs

- [Logout apenas local: o token continua válido no backend até expirar] → Aceito: a API demo não expõe endpoint de revogação; a mudança remove a sessão do cliente. Documentar no placeholder de ajuda que logout local não invalida o token server-side.
- [Placeholders podem parecer recursos quebrados] → Páginas exibem explicitamente "em construção"; escopo real de admin/help fica registrado como mudanças futuras.
- [Toolbar só na página principal: admin/help ficam sem navegação de retorno] → Aceito para manter o escopo mínimo; o componente de toolbar foi isolado justamente para viabilizar reuso depois.
- [Usuário sem sessão não consegue estar em `/main`, então o estado "Entrar" da toolbar só aparece transitoriamente] → Comportamento inofensivo e consistente; o botão reflete o estado real da sessão e fica correto se a toolbar for reutilizada em rotas públicas.
