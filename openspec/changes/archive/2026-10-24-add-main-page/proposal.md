# Proposal

## Why

Hoje o componente raiz `App` é a própria tela de login e, após autenticar com sucesso, apenas exibe a mensagem "Login realizado com sucesso!" sem navegar para lugar algum e sem aproveitar os dados do usuário retornados em `LoginResponse`. Não existe uma página principal do sistema: o usuário autenticado não tem para onde ir. Esta mudança cria essa página principal (banner, mensagem de boas-vindas e rodapé) e conecta o login a ela.

## What Changes

- **Nova tela principal** (`/main`) com:
  - **Banner** no topo contendo o nome do sistema, a logo do sistema e os dados do usuário autenticado (nome e e-mail de `LoginResponse.user`).
  - **Mensagem de boas-vindas** na área central, personalizada com o nome do usuário.
  - **Rodapé** com copyright e dados do autor.
- **Refatoração do login**: o formulário atual sai do componente raiz `App` e passa a ser a página da rota `/login` (mesmo comportamento e validações). Após login bem-sucedido, a resposta (`token` + `user`) passa a ser armazenada e o app redireciona para `/main`.
- **Sessão no frontend**: criação de um auth store baseado em signals que guarda a sessão (`token` + `user`) e persiste em `sessionStorage`, de modo que a tela principal consiga exibir os dados do usuário logado mesmo após refresh.
- **Proteção de rota**: acesso direto a `/main` sem sessão ativa redireciona para `/login`; a rota vazia `''` redireciona para `/main`.
- **Assets**: criação de uma logo placeholder (SVG) em `apps/frontend/public/`, pois hoje só existe `favicon.ico`.

## Capabilities

### New Capabilities

- `main-page`: composição e comportamento da tela principal do sistema — banner (nome do sistema, logo, dados do usuário logado), mensagem de boas-vindas central e rodapé com copyright e dados do autor.
- `auth-session`: fluxo de sessão no frontend — armazenamento da sessão após login, redirecionamento do login para a página principal, persistência durante a aba e redirecionamento de acesso não autenticado.

### Modified Capabilities

<!-- Nenhuma capability existente tem requisitos alterados: o contrato da API
     user-authentication (POST /api/auth/login) permanece igual; a mudança é
     somente comportamento de frontend. -->

## Impact

- **`apps/frontend/src/app/`**: `app.ts`/`app.html`/`app.scss` viram shell com `<router-outlet/>`; novo `login.*` (form movido de `app.*`), novo `main.*` (tela principal), `app.routes.ts` ganha rotas `/login`, `/main` e redirect de `''`.
- **Novo auth store** (service com signals + `sessionStorage`) consumido por `login` e `main`.
- **Assets**: novo SVG de logo em `apps/frontend/public/`.
- **Testes**: `app.spec.ts` precisa ser reestruturado (login sai de `App`); novos specs para `login` e `main` (Vitest + jsdom, com `provideHttpClientTesting` onde houver chamadas HTTP).
- **Backend/shared**: sem alterações — `LoginResponse` (`token`, `user.id/name/email`) já fornece tudo que a tela principal exibe.

## Suposições

- Nome do sistema: "AngularApp" (consistente com o `title` de `index.html`), definido em um único lugar.
- Dados do usuário no banner: nome e e-mail (campos disponíveis em `LoginResponse.user`).
- Dados do autor no rodapé: conteúdo estático definido em constante única, com nome do autor placeholder a ser ajustado.
- Sem sessão ativa, `/main` redireciona para `/login` (guarda simples) em vez de exibir a página com dados vazios.
