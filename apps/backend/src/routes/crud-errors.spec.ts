import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createCrudTestApp } from '../testing/harness.js';
import { personRoutes } from './person.js';

describe('Erros centralizados e auditoria no CRUD de person', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let close: () => Promise<void>;

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(personRoutes, { prefix: '/api/person' });
    });
    app = testApp.app;
    close = testApp.close;
  });

  afterAll(async () => {
    await close();
  });

  it('corpo sem campos obrigatórios responde 400 com { message }', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/person',
      payload: { name: 'Sem código' },
    });
    expect(response.statusCode).toBe(400);
    expect(typeof response.json().message).toBe('string');
  });

  it('corpo com campo acima do limite responde 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/person',
      payload: { code: 'X'.repeat(20), name: 'Nome', shortName: 'N9', email: 'n9@example.com' },
    });
    expect(response.statusCode).toBe(400);
  });

  it('id inexistente responde 404 com { message }', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/person/00000000-0000-0000-0000-000000000000',
    });
    expect(response.statusCode).toBe(404);
    expect(typeof response.json().message).toBe('string');
  });

  it('email duplicado responde 409 com { message }', async () => {
    const first = await app.inject({
      method: 'POST',
      url: '/api/person',
      payload: { code: 'PA01', name: 'Primeira', shortName: 'PA1', email: 'pa1@example.com' },
    });
    expect(first.statusCode).toBe(201);
    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/person',
      payload: { code: 'PA02', name: 'Duplicada', shortName: 'PA2', email: 'pa1@example.com' },
    });
    expect(duplicate.statusCode).toBe(409);
    expect(typeof duplicate.json().message).toBe('string');
  });

  it('criação carimba auditoria completa e PATCH renova data_updated/user_updated', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/person',
      payload: { code: 'PB01', name: 'Auditada', shortName: 'PB1', email: 'pb1@example.com' },
    });
    expect(created.statusCode).toBe(201);
    const createdBody = created.json();
    expect(createdBody.userCreated).toBe('system');
    expect(createdBody.userUpdated).toBe('system');
    expect(createdBody.active).toBe(true);
    expect(createdBody.dataCreated).toBeTruthy();
    expect(createdBody.dataUpdated).toBeTruthy();

    await new Promise((resolve) => setTimeout(resolve, 20));
    const updated = await app.inject({
      method: 'PATCH',
      url: `/api/person/${createdBody.id}`,
      payload: { name: 'Auditada (atual)' },
    });
    expect(updated.statusCode).toBe(200);
    const updatedBody = updated.json();
    expect(updatedBody.name).toBe('Auditada (atual)');
    expect(updatedBody.userUpdated).toBe('system');
    expect(new Date(updatedBody.dataUpdated).getTime()).toBeGreaterThan(
      new Date(updatedBody.dataCreated).getTime(),
    );
  });
});
