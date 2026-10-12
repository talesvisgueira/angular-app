import 'reflect-metadata';
import Fastify, { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DataSource } from 'typeorm';
import { ENTITIES, MIGRATIONS } from '../database/data-source.js';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { countryRoutes } from './country.js';

describe('CRUD de country (integração com banco migrado)', () => {
  let dataSource: DataSource;
  let app: FastifyInstance;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: ENTITIES,
      migrations: MIGRATIONS,
      synchronize: false,
      migrationsRun: true,
    });
    await dataSource.initialize();

    app = Fastify({ logger: false });
    app.decorate('dataSource', dataSource);
    registerErrorHandler(app);
    await app.register(countryRoutes, { prefix: '/api/country' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await dataSource.destroy();
  });

  it('ciclo completo preenchendo auditoria e renovando data_updated no PATCH', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/country',
      payload: { sigla: 'BR', nome: 'Brasil' },
    });
    expect(created.statusCode).toBe(201);
    const createdBody = created.json();
    expect(createdBody.userCreated).toBe('system');
    expect(createdBody.dataCreated).toBeTruthy();
    expect(createdBody.dataUpdated).toBeTruthy();

    const listed = await app.inject({ method: 'GET', url: '/api/country?limit=10&offset=0' });
    expect(listed.statusCode).toBe(200);
    expect(listed.json()).toMatchObject({ total: 1 });

    const updated = await app.inject({
      method: 'PATCH',
      url: `/api/country/${createdBody.id}`,
      payload: { nome: 'Brasil (atual)' },
    });
    expect(updated.statusCode).toBe(200);
    const updatedBody = updated.json();
    expect(updatedBody.nome).toBe('Brasil (atual)');
    expect(new Date(updatedBody.dataUpdated).getTime()).toBeGreaterThan(
      new Date(updatedBody.dataCreated).getTime(),
    );

    const removed = await app.inject({ method: 'DELETE', url: `/api/country/${createdBody.id}` });
    expect(removed.statusCode).toBe(204);

    const missing = await app.inject({ method: 'GET', url: `/api/country/${createdBody.id}` });
    expect(missing.statusCode).toBe(404);
  });

  it('sigla duplicada responde 409', async () => {
    const first = await app.inject({
      method: 'POST',
      url: '/api/country',
      payload: { sigla: 'AR', nome: 'Argentina' },
    });
    expect(first.statusCode).toBe(201);
    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/country',
      payload: { sigla: 'AR', nome: 'Duplicado' },
    });
    expect(duplicate.statusCode).toBe(409);
  });
});
