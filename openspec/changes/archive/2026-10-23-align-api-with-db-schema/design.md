# Design

## Context

O esquema real do banco é definido por `apps/backend/src/database/migrations/1700000003000-AddNewDB.ts` (18 tabelas), aplicado automaticamente na inicialização (`migrationsRun: true`, `synchronize: false`). As entidades e rotas atuais ainda seguem o esquema anterior (motivação em proposal.md). O padrão de implementação consolidado no backend é:

- Entidades TypeORM em `src/entities/*.entity.ts` com colunas snake_case mapeadas para propriedades camelCase e hooks `@BeforeInsert`/`@BeforeUpdate` para `data_created`/`data_updated`.
- Rotas CRUD geradas por `buildCrudRoutes` (`src/routes/crud-helpers.ts`), com schemas JSON para validação e Swagger; `prepare` injeta `userCreated`.
- Testes de rota (ex.: `country.spec.ts`) sobem um Fastify real contra SQLite temporário com migrations.

## Goals / Non-Goals

**Goals:**

- Entidades 1:1 com as tabelas e colunas reais (nomes, tipos, nullability, FKs), sem migrations novas.
- Cobertura CRUD das 18 tabelas com o mesmo padrão de rota/paginação/erros.
- Auditoria completa (`active`, `user_created`, `data_created`, `user_updated`, `data_updated`) preenchida pela camada de API.
- Login validado contra `user`/`person` mantendo o contrato `LoginResponse` do `@monorepo/shared`.

**Non-Goals:**

- Hash de senhas (ver Riscos) e autorização RBAC nas rotas.
- Índices secundários no banco (a migration atual não os cria; a metadata `@Index` das entidades é declarativa e não materializa com `synchronize: false`).
- Alterar a migration `1700000002000-AddCrudApiFoundation copy.ts` (nome com espaço é feio, mas funciona e está fora do escopo).
- Mudanças no frontend ou no `@monorepo/shared`.

## Decisions

1. **Banco como fonte de verdade; nenhuma migration nova.** A migration 3000 já define o esquema pretendido; editar migrations antigas quebraria bancos existentes (hash de histórico). Entidades e rotas se ajustam a ela.
   - _Alternativa descartada_: migration "corretiva" adicional — duplicaria a definição do esquema.

2. **Auditoria completa via hooks + `prepare`.** As entidades passam a mapear `active`, `user_created` e `user_updated`; `buildCrudRoutes` injeta `userCreated = userUpdated = SYSTEM_USER` (e `active = true` quando ausente) na criação, e o hook `@BeforeUpdate` renova `dataUpdated`/`userUpdated` na atualização. Motivo: colunas `NOT NULL` sem default (`user_created`, `user_updated`) fazem todo `INSERT` falhar hoje.
   - _Alternativa descartada_: defaults no banco via migration — exigiria migration nova.

3. **`CountryState` → `State`.** Novo arquivo `state.entity.ts` (`@Entity('state')`, colunas `short_name`/`name`), rota `state.ts` com prefixo `/api/state`; `country-state.entity.ts`/`country-state.ts` removidos. O frontend não consome a rota antiga.

4. **`User.personId` como coluna própria.** Relação `ManyToOne` para `Person` via `@JoinColumn({ name: 'person_id' })` — o banco define FK simples em `person_id` (sem unicidade), então `ManyToOne` reflete a cardinalidade real; `person` deixa de ser join por `id` compartilhado. Ganha `authenticationMode` com default `PASSWORD` (constante na entidade).

5. **Pivots sem `organization_id`.** `ModuleRule`, `ProfileRule` e `OrganizationUserProfile` perdem a coluna/relação `organization` (a tabela `organization_user_profile` do banco não a tem mais). O isolamento por tenant continua existindo nas tabelas que retêm `organization_id` (`profile`, `module`, `module_organization`, `organization_module`, `organization_user`).

6. **Novos recursos seguem o padrão existente.** `City`, `PersonAddress`, `PersonPhone`, `UserAuthenticationMode`, `System`, `ModuleOrganization` ganham entidade + rota `buildCrudRoutes` + registro em `server.ts`. Particularidades: `PersonPhone` usa colunas `numeric` (tipos `number` na entidade); `PersonAddress`/`PersonPhone` têm `person_id` nullable (FK só valida quando informado).

7. **Login consulta o banco por email da pessoa.** `POST /api/auth/login` busca `user` com `join` em `person` por `person.email` e compara `password` (texto puro, mesmo formato gravado pelo CRUD de `user`). Sucesso → `LoginResponse` com `user.id` do usuário e `name`/`email` da pessoa; falha → 401 genérico (mesma mensagem para email inexistente e senha errada, sem revelar qual falhou). `isLoginRequest` e o DTO `LoginRequest`/`LoginResponse` do shared permanecem inalterados.
   - _Alternativa descartada_: aceitar `username` também — mudaria o contrato do shared.

8. **Atualização do `country.spec.ts` em harness reutilizável.** O setup (SQLite temporário + migrations + Fastify) vira helper compartilhado; specs novos para `state`, os 6 recursos novos e o login reutilizam o harness.

## Risks / Trade-offs

- [Senhas em texto puro, comparadas e gravadas sem hash] → Documentado como limitação; change futura de hashing (bcrypt + migration de dado) deverá tratar gravação e comparação juntas. Nenhum dado real de produção conhecido hoje (banco demo local).
- [`user_updated` sempre `system`] → Não há identidade autenticada nas rotas CRUD; quando autenticação real chegar às rotas, o `prepare`/hooks passam a usar o solicitante. Contrato da API não muda.
- [BREAKING amplo nos payloads (`codigo`→`code`, `sigla`→`shortName`, `nome`→`name`, `endereco`→`address`, `bairro`→`district`)] → Consumidores conhecidos: apenas o frontend, que não usa esses endpoints; Swagger documenta os novos campos.
- [Entidades `numeric` (SQLite) retornam `number`] → Schemas de rota declaram `type: number` para `person_phone`, evitando mismatch de serialização.
- [Login 401 genérico dificulta diagnóstico] → Mensagem única é intencional (não vaza existência de email); log do backend registra o motivo.

## Migration Plan

- Sem migration de banco: deploy = atualizar código e reiniciar o backend (`migrationsRun` reaproveita o estado atual; bancos que já aplicaram a migration 3000 não mudam).
- Rollback: reverter o deploy do backend (nenhum dado novo de esquema a desfazer); registros criados pelos novos endpoints permanecem válidos no esquema atual.
- Ordem de implementação (para o banco nunca ficar exposto com API quebrada): entidades → `crud-helpers`/`data-source` → rotas existentes → rotas novas → login → testes.
