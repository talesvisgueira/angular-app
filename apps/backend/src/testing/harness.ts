import 'reflect-metadata';
import Fastify, { type FastifyInstance } from 'fastify';
import { expect } from 'vitest';
import { DataSource } from 'typeorm';
import { ENTITIES, MIGRATIONS } from '../database/data-source.js';
import { registerErrorHandler } from '../plugins/error-handler.js';

export interface CrudTestApp {
  app: FastifyInstance;
  dataSource: DataSource;
  close: () => Promise<void>;
}

/** Auditoria para gravações diretas por repositório nos testes (fora da API). */
export const TEST_AUDIT = { userCreated: 'system', userUpdated: 'system' } as const;

/**
 * Sobe um Fastify real com SQLite temporário (`:memory:`), aplica todas as
 * migrations, decora `dataSource` e registra o error handler central.
 * O callback registra as rotas sob teste.
 */
export async function createCrudTestApp(
  register: (app: FastifyInstance) => Promise<void> | void,
): Promise<CrudTestApp> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: ENTITIES,
    migrations: MIGRATIONS,
    synchronize: false,
    migrationsRun: true,
  });
  await dataSource.initialize();

  const app = Fastify({ logger: false });
  app.decorate('dataSource', dataSource);
  registerErrorHandler(app);
  await register(app);
  await app.ready();

  return {
    app,
    dataSource,
    close: async () => {
      await app.close();
      await dataSource.destroy();
    },
  };
}

export interface CrudCycleOptions {
  /** Prefixo do recurso, ex.: `/api/city`. */
  base: string;
  /** Payload do POST (201 esperado). */
  create: Record<string, unknown>;
  /** Payload do PATCH (200 esperado). */
  patch: Record<string, unknown>;
  /** Propriedade do corpo usada para conferir o resultado do PATCH. */
  patchField: string;
}

/**
 * Exercita o ciclo CRUD padrão do recurso: cria, lista paginada, busca por id,
 * atualiza, remove e confirma 404 após a remoção. Retorna o corpo do POST.
 */
export async function expectCrudCycle(
  app: FastifyInstance,
  { base, create, patch, patchField }: CrudCycleOptions,
): Promise<Record<string, unknown>> {
  const created = await app.inject({ method: 'POST', url: base, payload: create });
  expect(created.statusCode).toBe(201);
  const createdBody = created.json() as Record<string, unknown>;
  expect(typeof createdBody.id).toBe('string');

  const listed = await app.inject({ method: 'GET', url: `${base}?limit=10&offset=0` });
  expect(listed.statusCode).toBe(200);
  expect(listed.json()).toMatchObject({ total: 1 });

  const found = await app.inject({ method: 'GET', url: `${base}/${createdBody.id}` });
  expect(found.statusCode).toBe(200);
  expect(found.json()).toMatchObject({ id: createdBody.id });

  const updated = await app.inject({
    method: 'PATCH',
    url: `${base}/${createdBody.id}`,
    payload: patch,
  });
  expect(updated.statusCode).toBe(200);
  const updatedBody = updated.json() as Record<string, unknown>;
  expect(updatedBody[patchField]).toEqual(patch[patchField]);
  expect(new Date(updatedBody.dataUpdated as string).getTime()).toBeGreaterThanOrEqual(
    new Date(createdBody.dataCreated as string).getTime(),
  );

  const removed = await app.inject({ method: 'DELETE', url: `${base}/${createdBody.id}` });
  expect(removed.statusCode).toBe(204);

  const missing = await app.inject({ method: 'GET', url: `${base}/${createdBody.id}` });
  expect(missing.statusCode).toBe(404);

  return createdBody;
}
