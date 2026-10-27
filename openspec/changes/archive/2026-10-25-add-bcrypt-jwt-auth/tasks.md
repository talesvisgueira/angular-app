# Tasks

## 1. Shared: contrato e utilitários de JWT

- [x] 1.1 Em `packages/shared/src/auth.ts`, adicionar `profiles: string[]` a `User`, o tipo `AuthClaims` (payload do JWT: `sub`, `email`, `name`, `profiles`, `exp`), `parseJwt(token)` (valida 3 segmentos, decodifica payload base64url e valida shape mínimo, sem verificar assinatura) e `isTokenExpired(claims, now?)`; verificar com `pnpm build` compilando `shared` antes dos apps

## 2. Backend: hash bcrypt das senhas

- [x] 2.1 Adicionar `bcryptjs` (v3, tipos embutidos) em `apps/backend` e confirmar que a instalação não exige script bloqueado pelo pnpm 12 (`pnpm install` sem avisos de build para o pacote)
- [x] 2.2 Em `src/entities/user.entity.ts`, hashear em `@BeforeInsert`/`@BeforeUpdate` somente quando o valor ainda não é hash bcrypt (prefixos `$2a$`/`$2b$`/`$2y$`); verificar com teste de `POST`/`PATCH /api/user` gravando hash e não o texto plano
- [x] 2.3 Criar migration de backfill que converte senhas sem prefixo bcrypt em hash e com `down()` no-op; verificar com teste no padrão de `migrations.spec.ts`: usuário com senha em texto plano fica hasheado após a migration e autentica no login

## 3. Backend: login com JWT e endpoint de validação

- [x] 3.1 Adicionar `jose` em `apps/backend` e criar módulo de configuração que lê `JWT_SECRET` com fallback de desenvolvimento e aviso único no log; verificar com `pnpm --filter @monorepo/backend typecheck`
- [x] 3.2 Em `src/routes/auth.ts`, substituir a comparação por `bcrypt.compare`, buscar os perfis ativos (`organization_user_profile` ativo → `profile` ativo, nomes distintos, `[]` sem vínculos), retornar `user.profiles` e assinar JWT HS256 com `sub`/`email`/`name`/`profiles`/`iat`/`exp` de 20 minutos; atualizar `auth.spec.ts`: login com usuário de senha hasheada, senha errada 401, claims do token (incl. `exp` ~20 min e `profiles`), usuário sem perfis com `profiles: []`
- [x] 3.3 Implementar `POST /api/auth/validate` (header `Authorization: Bearer`, `jwtVerify`): 200 com os claims ou 401 `{ message }` quando ausente/inválido/expirado; verificar com testes de rota usando tokens assinados pelo módulo de configuração, incluindo token expirado
- [x] 3.4 Atualizar a nota de autenticação no `AGENTS.md` (login com bcrypt contra o banco, resposta com JWT de 20 minutos e `POST /api/auth/validate`); verificar que o texto reflete o comportamento novo

## 4. Frontend: sessão valida o JWT

- [x] 4.1 Em `src/app/session/session-store.ts`: `set(response)` valida o token com `parseJwt`/`isTokenExpired` e retorna `boolean` (inválido/expirado não armazena), reidratação descarta sessão com token inválido/expirado (limpando o storage) e novo `hasValidSession()` avalia o token no momento da chamada; verificar com testes em `session-store.spec.ts` usando JWTs válidos, expirados e malformados gerados com os helpers do shared
- [x] 4.2 Em `src/app/login/login.ts`: tratar retorno `false` de `set()` como falha — mensagem de erro "Resposta de autenticação inválida.", sem navegação; verificar com teste simulando resposta 200 com token inválido
- [x] 4.3 Usar `hasValidSession()` no `authGuard` e no redirecionamento da `splash` (sessão com token expirado/inválido → login); verificar com testes em `auth-guard.spec.ts`, `splash.spec.ts` e `app.routes.spec.ts` (sessão semeada com token expirado termina no login)

## 5. Verificação integrada

- [x] 5.1 Rodar `pnpm build` e `pnpm typecheck` na raiz e corrigir qualquer erro de compilação
- [x] 5.2 Rodar `pnpm test` na raiz e confirmar que os suites de frontend e backend passam
- [x] 5.3 Executar `pnpm migration:run`, subir `pnpm dev` e validar o fluxo manual: login com usuário existente → token JWT decodificável com `exp` de 20 minutos e perfis; `POST /api/auth/validate` com o token responde 200; com `exp` alterado para o passado a sessão é descartada e a aplicação volta ao login

## Workflow follow-up

- Arquivar a mudança após a revisão dos requisitos (`/opsx-archive`).
- Verificar o resultado arquivado.
