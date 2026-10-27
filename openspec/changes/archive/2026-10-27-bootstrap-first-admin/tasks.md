# Tasks

## 1. Contratos compartilhados (`packages/shared`)

- [x] 1.1 Adicionar em `src/auth.ts` os tipos `HasUsersResponse` (`{ hasUsers: boolean }`) e `SetupRequest` (estrutura aninhada: `organization: { name, email }`, `admin: { name, email, username, password }`) e o validador `isSetupRequest` (campos obrigatórios, formato de email, senha mínima de 6 caracteres), exportando por `src/index.ts`; verificar com `pnpm typecheck` e consumo pelo backend/frontend

## 2. Backend — bootstrap da primeira execução (`apps/backend`)

- [x] 2.2 Implementar `GET /api/auth/has-users` em `src/routes/auth.ts` respondendo 200 com `{ hasUsers }` (consulta de existência na tabela `user`) e cobrir com specs em `src/routes/auth.spec.ts` via `createCrudTestApp`: base vazia → `false`; base com usuário (ativo e inativo) → `true`
- [x] 2.3 Implementar `POST /api/auth/setup` (caminho feliz): validar corpo com `isSetupRequest` (400), transação única criando person da organização → organization → person do admin → user → organization_user → profile `Administrador` → organization_user_profile, com `code`/`shortName` gerados e `address`/`district` padrão (`'NÃO INFORMADO'`), `userCreated`/`userUpdated` = `'system'`; responder 201 com `LoginResponse` montado pelo `signSessionToken` (`profiles: ['Administrador']`); specs verificando cada registro criado, hash bcrypt da senha (diferente do texto e validável por `bcrypt.compare`), JWT decodificável com claims e `user.profiles` = `['Administrador']`
- [x] 2.4 Implementar as recusas do setup e cobrir com specs: base com qualquer usuário → 409 sem criar registros; username ou email (organização ou admin) já utilizado → 409; corpo inválido/incompleto/senha curta → 400; cenário de corrida simulado (duas chamadas concorrentes) com no máximo um 201
- [x] 2.5 Documentar os dois endpoints no Swagger existente (schemas de requisição/resposta e códigos 200/201/400/409) e verificar em `pnpm dev` em `http://localhost:3000/docs`

## 3. Frontend — tela de cadastro e direcionamento de entrada (`apps/frontend`)

- [x] 3.1 Criar o componente `Signup` (`src/app/signup/`: `signup.ts/html/scss/spec.ts`) com Reactive Forms (organização: nome, email; admin: nome, email, username, senha + confirmação), validações locais (obrigatório, email, senha ≥ 6, senhas iguais) e estados `loading`/`error` no padrão do `Login`; cobrir specs: envia `SetupRequest` sem o campo de confirmação via `provideHttpClientTesting`, senhas divergentes não enviam requisição, 400/409 permanecem na tela com erro, 201 chama `SessionStore.set` e navega para `/main`, token inválido na resposta permanece na tela
- [x] 3.2 Registrar a rota pública `/signup` em `src/app/routes.ts` e cobrir em `app.routes.spec.ts` (rota carrega o `Signup` sem `authGuard`)
- [x] 3.3 Ajustar a splash (`src/app/splash/splash.ts`): sem sessão válida, consultar `GET /api/auth/has-users` e navegar para `/signup` quando `false` e para `/login` quando `true` (falha de rede → `/login`); atualizar `splash.spec.ts` com os três cenários
- [x] 3.4 Ajustar o login (`src/app/login/login.ts`): ao iniciar sem sessão válida, consultar `has-users` e redirecionar para `/signup` quando `false`, permanecendo quando `true`; atualizar `login.spec.ts` com os cenários
- [x] 3.5 No `Signup`, redirecionar para `/login` ao abrir quando `has-users` responde `true`, coberto na spec do componente

## 4. Verificação integrada

- [x] 4.1 Rodar `pnpm build` e `pnpm typecheck` na raiz sem erros
- [x] 4.2 Rodar `pnpm test` (frontend Vitest) e `pnpm --filter @monorepo/backend test` com todas as suites verdes, incluindo as novas specs de auth e signup
- [x] 4.3 Rodar `pnpm format` e conferir que nenhum arquivo além dos previstos mudou (`git status`)
  - Nota (decisão do usuário): o `pnpm format` também reformatou arquivos fora do escopo (entidades, specs de crud/sessão, docs, designs arquivados, lockfile) por o working tree carregar trabalho não commitado de changes anteriores. A formatação foi mantida após verificação de saúde: `pnpm typecheck` limpo, backend 83/83, frontend 72/72.
- [x] 4.4 Smoke manual com `pnpm dev`: banco vazio → splash direciona a `/signup`; cadastro da organização e do administrador autentica e navega para `/main`; logout e login com o email/senha cadastrados funciona; recarregar `/signup` com o sistema já populado redireciona ao login
