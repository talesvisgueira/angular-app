# Design

## Context

O backend autentica comparando a senha em texto plano (`user.password !== password`) e devolve um token opaco sem expiração (`demo-token-...`). O modelo já possui RBAC (`user` → `organization_user` → `organization_user_profile` → `profile`), mas o login não o utiliza. O frontend trata qualquer string como token válido, tanto ao receber o login quanto ao reidratar a sessão de `sessionStorage`. O backend é ESM (`"type": "module"`, NodeNext) sobre SQLite/better-sqlite3, com migrations TypeORM e testes via harness `createCrudTestApp`. Motivação e escopo: ver `proposal.md`.

## Goals / Non-Goals

**Goals:**

- Nenhuma senha legível no banco: hash bcrypt na gravação e comparação bcrypt no login.
- JWT HS256 com `exp` de 20 minutos contendo identidade e perfis do usuário.
- Contrato de validação de token no servidor (`POST /api/auth/validate`).
- Frontend valida estrutura e expiração do JWT ao receber e ao restaurar a sessão.
- Utilitários de JWT (tipos de claims, decodificação, verificação de expiração) no `@monorepo/shared`, reutilizados pelo frontend.

**Non-Goals:**

- Proteger os demais endpoints CRUD com o JWT (continuam públicos; mudança futura).
- Refresh/renovação de token, revogação ou blacklist.
- Verificação de assinatura no frontend (impossível sem o segredo; a validação local é estrutural + `exp`).
- Exibir perfis na UI (apenas disponibilizá-los na sessão).
- Alterar o schema das tabelas (`password varchar(200)` já acomoda o hash de 60 caracteres).

## Decisions

1. **`bcryptjs` para hash/compare** — biblioteca pedida pelo usuário ("bcryptojs"); JS puro, sem build nativo (pnpm 12 bloqueia scripts de postinstall) e com tipos embutidos na v3. Alternativas descartadas: `bcrypt` (compilação nativa) e `argon2` (não foi pedido). Custo de hash padrão (10).

2. **Hash centralizado nos hooks da entidade `User`** — `@BeforeInsert`/`@BeforeUpdate` hasheiam a senha quando o valor ainda não é hash bcrypt (prefixo `$2a$`/`$2b$`/`$2y$`). Ponto único de gravação que cobre `POST/PATCH /api/user`, seeds e futuros caminhos; alternativa (hashear no service/rota) exigiria lembrar em cada ponto de escrita.

3. **Backfill por migration, sem fallback de texto plano no login** — nova migration converte linhas cuja senha não é hash bcrypt; o login usa somente `bcrypt.compare`. Alternativa (aceitar texto plano e re-hashear no login) mantaria credenciais legíveis indefinidamente. O `down()` da migration é no-op (não é possível recuperar o texto original).

4. **`jose` para assinar/verificar o JWT** — ESM nativo (encaixa no backend sem interop CJS), tipos TS incluídos, mantido ativamente. Alternativas: `jsonwebtoken` (CJS + `@types`) e `@fastify/jwt` (acoplamento a plugin para um único sign/verify). Algoritmo HS256; `exp` = 20 minutos (1200s) e `iat`; claims: `sub` (id do usuário), `email`, `name`, `profiles: string[]`.

5. **Segredo em `JWT_SECRET` com fallback de desenvolvimento** — lido de `process.env.JWT_SECRET`; sem a variável, usa valor fixo de dev e registra aviso único no startup. Em produção a variável SHALL ser definida (documentado; sem validação dura para não quebrar o ambiente local).

6. **Perfis por nomes dos perfis ativos** — após localizar o `user`, busca os vínculos ativos (`organization_user_profile` ativo → `profile` ativo) e coleta `profile.name` distintos; usuário sem vínculos recebe `[]`. Nomes (e não ids) porque o payload alimenta exibição e decisão de perfil no frontend; ids continuam disponíveis via `sub` se necessário.

7. **Helpers de JWT no shared** — `packages/shared/src/auth.ts` exporta: tipo `AuthClaims` (payload), `parseJwt(token)` (divide em 3 segmentos, decodifica o payload base64url via `atob` — disponível em Node 18+ e browsers — e valida shape mínimo) e `isTokenExpired(claims, now?)`. `parseJwt` NÃO verifica assinatura; a verificação criptográfica é exclusivamente do backend (`POST /api/auth/validate`).

8. **Validação no frontend em dois pontos** — (a) no login: `SessionStore.set(response)` valida o token com os helpers e retorna `boolean`; `false` mantém o usuário no login com mensagem de erro ("Resposta de autenticação inválida.") sem armazenar nada; (b) na sessão armazenada: a reidratação descarta sessões com token inválido/expirado, e um método `hasValidSession()` avalia o token no momento da chamada (usado pelo `authGuard` e pelo redirecionamento da splash), pois `exp` não é reativo a signals.

## Risks / Trade-offs

- [Usuário existente com senha em texto plano não roda a migration] → o login falha com 401; mitigation: migration roda em `migration:run` (já automatizado no projeto) e o `migrationsRun: true` do harness cobre os testes.
- [Segredo de desenvolvimento no fallback] → tokens assinados com segredo conhecido em ambientes sem `JWT_SECRET`; mitigation: aviso no log e instrução de definir a variável em produção.
- [Relógio do cliente adiantado/atrasado] → frontend pode considerar expirado um token ainda válido (ou o contrário, por segundos); trade-off aceito: sem tolerância no frontend para ser conservador; o servidor permanece a fonte da verdade via `/api/auth/validate`.
- [Perfis no JWT ficam desatualizados se o vínculo mudar durante a sessão] → o payload reflete o momento do login; renovação/refresh é Non-Goal e mitigação futura.
- [BCrypt adiciona latência ao login (~60–100ms por compare)] → intencional (força de hashing); custo fixo por tentativa limita brute force.
- [Migration hasha dentro do processo Node] → bcryptjs é JS puro e determinístico no custo; volume esperado de usuários em dev é pequeno.

## Migration Plan

1. Adicionar dependências (`bcryptjs`, `jose`) e o código novo (hooks, rota, validate, shared helpers).
2. `pnpm migration:run` — backfill converte senhas em texto plano para hash.
3. Reiniciar backend; login/validate passam a exigir o novo fluxo.
4. Rollback: `pnpm migration:revert` (no-op do backfill) e deploy da versão anterior; tokens emitidos pela versão nova são rejeitados pela antiga (era demo-token), o que apenas força novo login.

## Open Questions

(nenhuma — as escolhas de biblioteca, claims e formato dos perfis foram resolvidas com o usuário via proposal; os detalhes restantes são de implementação.)
