# AGENTS.md

pnpm-workspaces monorepo: Angular 22 frontend + Fastify/TypeScript backend + shared types package.

## Layout

- `apps/frontend` (`@monorepo/frontend`) — Angular 22 standalone, signals, SCSS. Entrypoint `src/main.ts`.
- `apps/backend` (`@monorepo/backend`) — Fastify API. Entrypoint `src/server.ts`; routes in `src/routes/`.
- `packages/shared` (`@monorepo/shared`) — shared DTOs (`LoginRequest`, `LoginResponse`, `User`) and `isLoginRequest` validator. Used by both apps.

## Commands (run from repo root)

- Install: `corepack enable && pnpm install` (pnpm 12 is pinned via `packageManager`; do NOT use npm/yarn).
- Dev (both apps): `pnpm dev` — builds `shared` first, then runs frontend (:4200) + backend (:3000) in parallel.
- Dev individually: `pnpm dev:frontend` / `pnpm dev:backend`.
- Migrations: `pnpm migration:run` / `pnpm migration:revert` — applies/reverts the backend TypeORM migrations (delegates to `@monorepo/backend`).
- Build: `pnpm build` — `pnpm -r build`, topological order. `shared` MUST be built before either app (its `exports` point at `dist/`).
- Typecheck all: `pnpm typecheck`.
- Format: `pnpm format` (Prettier root config, printWidth 100, single quotes).
- Scaffold (frontend cwd): `pnpm --filter @monorepo/frontend exec ng generate component path/name`.

## Frontend tests

- `pnpm test` runs Vitest (jsdom) via `@angular/build:unit-test`. Do NOT add Karma/Jasmine config.
- Single file: `pnpm --filter @monorepo/frontend test -- --include=src/app/app.spec.ts`.
- Filter by name: `pnpm --filter @monorepo/frontend test -- --filter '^App'`.
- Vitest globals are on (`tsconfig.spec.json` → `vitest/globals`); `describe/it/expect` need no import.
- `App` injects `HttpClient`; specs must provide `provideHttpClient()` + `provideHttpClientTesting()`.

## Backend

- Dev with watch: `pnpm dev:backend` (tsx). Built output: `node apps/backend/dist/server.js`.
- DB-backed auth: `POST /api/auth/login` validates email/password against the database; passwords are stored as bcrypt hashes (hashed by entity hooks on save; legacy plaintext rows are converted by the `HashPlaintextPasswords` migration). Success returns a `LoginResponse` with a JWT (HS256, 20-minute `exp`) whose payload carries `sub`, `email`, `name` and `profiles` (active profile names via `organization_user_profile`). Wrong password/unknown email → 401; invalid body → 400. Token verification endpoint: `POST /api/auth/validate` (`Authorization: Bearer <jwt>`) → 200 with claims or 401. Signing secret comes from `JWT_SECRET` (dev fallback with a warning).
- ESM + `module: NodeNext`: relative imports inside `src/` need the `.js` extension (e.g. `./routes/auth.js`).

## Gotchas

- pnpm 12 blocks postinstall scripts. Allowed packages (`esbuild`, `lmdb`, `@parcel/watcher`, `msgpackr-extract`) are listed under `allowBuilds:` in `pnpm-workspace.yaml` — keep them there or Angular/Vitest builds break.
- Angular 22 file naming has no `.component` suffix: `app.ts`, `app.html`, `app.scss`, `app.spec.ts` (class `App`). Components are standalone (`@Component({ imports: [...] })`), no NgModules.
- Frontend dev server proxies `/api` → `http://localhost:3000` (`apps/frontend/proxy.conf.json`).
- No ESLint/lint config or script. Use `pnpm build` for compile/type errors and Prettier for style.
- There is no e2e setup despite what upstream Angular README text implied.
