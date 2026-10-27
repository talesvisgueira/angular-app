# Proposal

## Why

O login atual compara a senha em texto plano e emite um token falso (`demo-token-...`) sem expiração nem conteúdo útil, e o frontend aceita qualquer string como sessão. Isso impede qualquer controle de acesso real: é preciso proteger credenciais com hash bcrypt e emitir um JWT verificável, com perfis do usuário e expiração de 20 minutos, que o frontend saiba validar.

## What Changes

- **BREAKING**: senhas de usuários passam a ser armazenadas apenas como hash bcrypt; o login passa a comparar com `bcrypt.compare` (usuários existentes com senha em texto plano são re-hashados por migration de backfill).
- **BREAKING**: `POST /api/auth/login` passa a emitir um JWT (HS256, `exp` de 20 minutos) no lugar do token demo; o payload contém `sub` (id do usuário), `email`, `name` e `profiles`.
- **BREAKING**: o contrato `User` do `@monorepo/shared` passa a incluir `profiles: string[]` (nomes dos perfis ativos via `organization_user_profile`), presente também no payload do JWT.
- Novo endpoint `POST /api/auth/validate` que verifica assinatura e expiração de um JWT (`Authorization: Bearer`), devolvendo os claims (200) ou 401.
- O frontend passa a validar o token recebido: estrutura de JWT e expiração (`exp`), descartando a sessão quando o token é inválido ou expirado e tratando o usuário como não autenticado (redirecionamento ao login).
- Criação/atualização de usuário (`POST`/`PATCH /api/user`) passa a gravar a senha já hasheada.

## Capabilities

### New Capabilities

(nenhuma — a mudança evolui capabilities existentes)

### Modified Capabilities

- `user-authentication`: validação de senha por hash bcrypt na comparação de login; resposta de login passa a conter JWT assinado com `exp` de 20 minutos e claim `profiles`; emissão de hash em criação/_atualização_ de usuário via API; novo requisito de endpoint de validação de token (`POST /api/auth/validate`).
- `auth-session`: sessão do frontend passa a validar o token JWT recebido (estrutura e expiração) ao receber e ao restaurar a sessão; token inválido/expirado é descartado e tratado como ausência de sessão; perfis do usuário ficam disponíveis na sessão.

## Impact

- **Backend (`apps/backend`)**: `src/routes/auth.ts` (comparação bcrypt, assinatura e verificação de JWT), `src/entities/user.entity.ts` (hooks de hash em `BeforeInsert`/`BeforeUpdate`), nova migration de backfill para senhas em texto plano; novas dependências `bcryptjs` e `jose` (ambas JS puro, compatíveis com pnpm 12/ESM).
- **Shared (`packages/shared`)**: `src/auth.ts` — `User.profiles`, tipo de claims do JWT e utilitários de decodificação/validação de expiração reutilizados pelo frontend.
- **Frontend (`apps/frontend`)**: `src/app/session/session-store.ts` (validação de token ao receber e rehidratar), `src/app/session/auth-guard.ts` (sessão com token inválido/expirado → login); specs de sessão, guard e rotas.
- **Configuração**: segredo de assinatura lido de `JWT_SECRET` (env) com fallback de desenvolvimento documentado; sem alteração de schema de tabelas (coluna `password varchar(200)` já acomoda o hash de 60 caracteres).
- **Fora de escopo**: proteção dos demais endpoints CRUD com o JWT (continuam públicos); renovação/refresh de token; exibição dos perfis na UI.
