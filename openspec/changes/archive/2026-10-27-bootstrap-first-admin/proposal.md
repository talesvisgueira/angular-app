# Proposal

## Why

Um sistema recém-instalado não tem nenhum usuário cadastrado e, como o login exige credenciais no banco, não existe forma de dar o primeiro acesso: a tela de login fica intransponível. É preciso um fluxo de primeiro acesso que detecte a ausência de usuários e permita cadastrar o administrador inicial junto com sua organização e o perfil Administrador.

## What Changes

- Novo endpoint público `GET /api/auth/has-users` que informa se já existe usuário cadastrado (`{ hasUsers: boolean }`), sem exigir sessão.
- Novo endpoint público `POST /api/auth/setup` que, em uma única transação, cria: a person da organização e a `organization` correspondente, a person do administrador e seu `user` (username e senha — hasheada pelos hooks da entidade), o vínculo `organization_user`, o perfil `Administrador` da organização e o vínculo `organization_user_profile`. Responde 201 com o mesmo contrato `LoginResponse` do login (JWT com `profiles: ['Administrador']`), viabilizando login automático.
- `POST /api/auth/setup` só é aceito enquanto não houver nenhum usuário cadastrado; com qualquer usuário existente, responde 409. Corpo inválido responde 400; username ou email já utilizado responde 409.
- O backend preenche com valores padrão os campos obrigatórios não coletados pelo formulário mínimo (`code`, `shortName` das persons; `address` e `district` da organização).
- **BREAKING** (fluxo de entrada): sem nenhum usuário cadastrado, a aplicação direciona para a tela de cadastro inicial (`/signup`) em vez da tela de login — tanto na decisão da splash quanto ao abrir `/login` sem usuários.
- Nova tela pública `/signup` com o formulário mínimo: organização (nome, email) e usuário (nome, email, username, senha + confirmação). Após o sucesso, a sessão é armazenada (login automático) e a aplicação navega para a página principal.

## Capabilities

### New Capabilities

- `first-run-setup`: provisionamento do sistema na primeira execução — verificação pública da existência de usuários, cadastro atômico do primeiro administrador com sua organização e perfil Administrador, validações e conflitos do cadastro, e a tela de cadastro inicial no frontend.

### Modified Capabilities

- `auth-session`: o direcionamento de entrada sem sessão passa a considerar a existência de usuários (sem usuários → `/signup`; com usuários → `/login`), e um cadastro inicial bem-sucedido estabelece a sessão da mesma forma que um login, navegando para a página principal.

## Impact

- **Backend (`apps/backend`)**: `src/routes/auth.ts` ganha `GET /auth/has-users` e `POST /auth/setup` (ambos públicos, sem guarda de sessão), reusando `signSessionToken` (`src/config/jwt.ts`) e os hooks de hash bcrypt de `user.entity.ts`; gravação de `Person`, `Organization`, `User`, `OrganizationUser`, `Profile` e `OrganizationUserProfile` dentro de uma transação do `DataSource`. Sem alteração de schema — nenhuma migration nova.
- **Shared (`packages/shared`)**: novos contratos de setup (carga útil do cadastro e resposta de verificação) com validadores reutilizados por backend e frontend, ao lado de `LoginRequest`/`isLoginRequest`.
- **Frontend (`apps/frontend`)**: nova rota pública `/signup` com componente de cadastro (`src/app/signup/`); `splash.ts` e `login.ts` passam a consultar `has-users` para decidir o direcionamento; reuso de `SessionStore` para o login automático.
- **Base já existente**: a emissão do token segue o mecanismo atual do login (JWT HS256, `exp` de 20 minutos, via `JWT_SECRET`) e a senha informada no cadastro é persistida como hash bcrypt pelos hooks da entidade — nenhuma mudança adicional de auth é necessária.
- **Fora de escopo**: criação de regras (`profile_rule`) para o perfil Administrador, convite/cadastro de outros usuários, publicação de módulos na organização e seleção de cidade/CEP no formulário.
