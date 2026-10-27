# Proposal

## Why

A página principal hoje não oferece navegação: após o login o usuário vê apenas banner, boas-vindas e rodapé, sem atalhos para as demais áreas do sistema nem forma de encerrar a sessão sem recarregar ou limpar o armazenamento manualmente.

## What Changes

- Adicionar uma toolbar de navegação na tela principal, entre o banner e a área central, com:
  - Link **Home** (página principal).
  - Link **Admin** (nova página de administração).
  - Link **Help** (nova página de ajuda).
  - Botão de **login/logout**, com rótulo conforme o estado da sessão ("Sair" com sessão ativa, "Entrar" sem sessão).
- Criar as rotas `/admin` e `/help` com páginas placeholder (conteúdo mínimo), protegidas pelo mesmo guard de autenticação da página principal.
- Adicionar o comportamento de **logout**: limpar a sessão (`token` e `user`, incluindo o espelho em `sessionStorage`) e redirecionar para `/login`.
- Adicionar o comportamento do botão de **login** na toolbar: sem sessão ativa, navegar para `/login`.

Suposição registrada: as páginas placeholder `/admin` e `/help` ficam protegidas por autenticação, em consistência com o restante do sistema (apenas `/login` é público). A implementação real da administração (CRUD do modelo RBAC, já especificado em `admin-crud-api`) e a página de ajuda definitiva ficam fora do escopo desta mudança.

## Capabilities

### New Capabilities

- `navigation`: destinos de navegação do sistema a partir da toolbar da página principal — links Home, Admin e Help, páginas placeholder `/admin` e `/help` e proteção por autenticação desses destinos.

### Modified Capabilities

- `main-page`: a composição da tela principal passa a incluir a toolbar de navegação (links e botão de login/logout) entre o banner e a área central.
- `auth-session`: novo comportamento de logout (encerrar sessão e redirecionar para o login) e do botão de login da toolbar (navegar para `/login` sem sessão ativa).

## Impact

- **Frontend** (`apps/frontend/src/app`):
  - `main/main.html`, `main/main.ts`, `main/main.scss` — toolbar na tela principal, com navegação e logout.
  - Novos componentes de página: `admin/` e `help/` (placeholders).
  - `app.routes.ts` — rotas `/admin` e `/help` com `authGuard`.
  - `session/session-store.ts` — reuso do `clear()` existente; sem mudança de contrato.
- **Backend**: nenhum impacto (logout é local, sem endpoint).
- **Specs**: `main-page` e `auth-session` ganham requisitos; nova capability `navigation`.
- **Testes**: specs de `main`, guardas e novas páginas (Vitest + jsdom, `provideHttpClientTesting` onde aplicável).
