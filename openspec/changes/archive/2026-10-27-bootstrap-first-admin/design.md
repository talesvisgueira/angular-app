# Design

## Context

A autenticação já é consolidada: `POST /api/auth/login` compara a senha com bcrypt e emite um JWT HS256 de 20 minutos via `signSessionToken` (`apps/backend/src/config/jwt.ts`); a entidade `User` hasheia senhas em texto plano nos hooks `BeforeInsert`/`BeforeUpdate`; `SessionStore` no frontend valida estrutura e `exp` do JWT antes de armazenar a sessão. As rotas de auth são registradas sob o prefixo `/api` e os CRUDs geram ids com `randomUUID()`, respondendo 201 na criação. O modelo exige `person` (com `code`, `short_name` e `email` únicos e obrigatórios) como raiz de `organization` (1:1 por `id`) e de `user` (N:1 por `person_id`), com os vínculos `organization_user` → `organization_user_profile` → `profile` (perfis são por organização). Motivação e escopo: ver proposal.md.

## Goals / Non-Goals

**Goals:**

- Permitir o primeiro acesso a um sistema vazio: verificação pública de usuários + cadastro atômico de organização, administrador e perfil `Administrador`, terminando com sessão autenticada.
- Reaproveitar integralmente os mecanismos existentes de sessão (JWT, hooks de hash, `SessionStore`) sem nova dependência nem migration.

**Non-Goals:**

- Criar `profile_rule` para o perfil `Administrador` (permissões granulares ficam para depois).
- Cadastro/convite de outros usuários; publicação de módulos (`module_organization`/`organization_module`).
- Seleção de cidade/CEP/endereço real no formulário (campos ficam com padrão do backend).
- Alterar login, CRUDs existentes ou o contrato atual de `LoginResponse`.

## Decisions

1. **Endpoints em `auth.ts`, ambos públicos** — `GET /api/auth/has-users` e `POST /api/auth/setup` entram no arquivo de rotas de auth, como os demais. Não há guard/middleware: são os únicos endpoints de bootstrap e o próprio `setup` se auto-limita (409 com qualquer usuário existente). Alternativa descartada: arquivo `setup.ts` separado — desnecessário para dois handlers que compartilham helpers.

2. **`hasUsers` conta qualquer registro em `user` (ativo ou não)** — literal: "usuário cadastrado". Se só houver usuários inativos, o bootstrap permanece fechado (409 no setup); reativação é tarefa administrativa fora de escopo. Alternativa (contar só ativos) reabriria o cadastro inicial inesperadamente quando o único admin for desativado.

3. **Duas persons: uma para a organização, outra para o administrador** — decide confirmado com o usuário. A `organization` compartilha o `id` da person jurídica (generalização do modelo); o `user` aponta para a person humana, com email próprio para login. Alternativa (person única compartilhada) misturaria identidade jurídica e humana e amarraria o email de login ao da organização.

4. **Criação atômica em uma transação do DataSource** — `app.dataSource.transaction(async (manager) => ...)` cria, nesta ordem: person da organização → organization → person do admin → user → organization_user → profile `Administrador` → organization_user_profile. O `userCreated` de todos os registros é `'system'` (ainda não há usuário ao criar os primeiros; o próprio admin nasce como consequência da transação). Pré-checagem de "não existe usuário" e das duplicidades é feita dentro da transação; as constraints únicas do banco (email/username/code/short_name) são a segunda linha de defesa — qualquer violação falha a transação e vira 409 mapeado.

5. **Formulário mínimo com defaults no backend** — decide confirmado. A API recebe apenas `organization: { name, email }` e `admin: { name, email, username, password }`. Backend gera `code` e `shortName` das duas persons a partir do nome + sufixo curto de `randomUUID()` (respeitando varchar(15)/(20) e unicidade) e preenche `address`/`district` da organização com `'NÃO INFORMADO'` (NOT NULL no modelo). `cityId`, `zipCode` e `parentId` ficam nulos (permitidos). Alternativa (exigir endereço no formulário) foi rejeitada pelo usuário.

6. **Resposta do setup = `LoginResponse` emitido igual ao login** — após a transação, o handler monta os claims (`sub`, `email`, `name`, `profiles: ['Administrador']`) e chama o mesmo `signSessionToken` do login. O `LoginResponse.user.profiles` reflete o vínculo recém-criado. Nenhum contrato novo de resposta é introduzido; quando a sessão expira (20 min), o admin simplesmente loga pela tela de login.

7. **Senha segue o fluxo padrão de persistência** — o handler grava `user.password` com o texto recebido; o hook `BeforeInsert` da entidade aplica o hash bcrypt. O setup não chama bcrypt diretamente (evita duplicar a regra e manteria o comportamento correto se a estratégia de hash mudar).

8. **Validação de contrato em `packages/shared`** — novos tipos `SetupRequest` (estrutura aninhada organização/admin), `HasUsersResponse` e `isSetupRequest` (obrigatoriedade, formato de email, senha ≥ 6), ao lado de `isLoginRequest`. Backend usa o validador para o 400; frontend o usa para feedback de formulário sem duplicar regras. Confirmação de senha é campo exclusivo do formulário (não vai no contrato) e validada localmente no componente.

9. **Frontend: componente `Signup` em `src/app/signup/` e decisão de entrada por consulta** — rota pública `/signup` em `app.routes.ts`. O componente consulta `has-users` ao iniciar: `true` → redireciona para `/login`. A splash, ao terminar sem sessão válida, consulta `has-users` e navega para `/signup` ou `/login`; a tela de login faz a mesma verificação ao iniciar (sem usuários → `/signup`). Estados do formulário seguem o padrão do `Login` (Reactive Forms + signals `loading`/`error`). No sucesso, `SessionStore.set(response)` valida o JWT: `true` → navega para `/main`; `false` → trata como erro na tela (requisito de sessão). Alternativa descartada: guard global de "setup pendente" — acoplaria todas as rotas a uma chamada extra.

10. **Erros mapeados para 400/409 com `{ message }`** — seguindo o padrão do login e do error handler central. 400: corpo inválido (`isSetupRequest` falha). 409: usuário já existente, username/email duplicado (pré-checagem na transação). O Swagger documentará os dois endpoints junto aos de auth.

## Risks / Trade-offs

- [Janela de corrida entre a pré-checagem e o insert] → Toda a checagem + gravação acontece dentro de uma transação; as constraints únicas do banco rejeitam o segundo cadastro concorrente, mapeado para 409.
- [`code`/`shortName` gerados podem colidir com dados pré-existentes sem usuários] → Sufixo aleatório de UUID torna a colisão improvável; a constraint única falha a transação e o cliente recebe 409, podendo reenviar.
- [`has-users` expõe a existência de usuários publicamente] → Apenas um booleano; o endpoint existe justamente para orientar o primeiro acesso. Sem lista de usuários ou metadados.
- [Splash/login/signup consultam a API antes de decidir] → Uma chamada leve por entrada; em falha de rede o direcionamento cai no comportamento atual (login) com mensagem de erro, sem bloquear a navegação.
- [Perfil `Administrador` nasce sem regras] → Consciente: perfis sem `profile_rule` não concedem permissões granulares ainda; o bootstrap garante identidade e vínculo, e regras são evolução futura.

## Migration Plan

Sem mudança de schema: nenhuma migration. Deploy é apenas a nova versão da API e do frontend. Rollback: reverter o deploy (os registros criados por um eventual setup permanecem válidos — são dados comuns do modelo, usáveis pelo login existente).

## Open Questions

Nenhuma — as decisões de escopo (login automático, duas persons, formulário mínimo) foram confirmadas com o usuário antes do planejamento.
