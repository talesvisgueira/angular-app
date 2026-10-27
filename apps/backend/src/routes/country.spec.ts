import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Country } from '../entities/country.entity.js';
import { createCrudTestApp, expectCrudCycle } from '../testing/harness.js';
import { countryRoutes } from './country.js';
import { stateRoutes } from './state.js';

describe('CRUD de country e state (integração com banco migrado)', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let dataSource: Awaited<ReturnType<typeof createCrudTestApp>>['dataSource'];
  let close: () => Promise<void>;

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(countryRoutes, { prefix: '/api/country' });
      instance.register(stateRoutes, { prefix: '/api/state' });
    });
    app = testApp.app;
    dataSource = testApp.dataSource;
    close = testApp.close;
  });

  afterAll(async () => {
    await close();
  });

  it('ciclo completo de country preenchendo auditoria e renovando data_updated no PATCH', async () => {
    const created = await expectCrudCycle(app, {
      base: '/api/country',
      create: { shortName: 'BR', name: 'Brasil' },
      patch: { name: 'Brasil (atual)' },
      patchField: 'name',
    });
    expect(created.userCreated).toBe('system');
    expect(created.userUpdated).toBe('system');
    expect(created.active).toBe(true);
  });

  it('ciclo completo de state vinculado a um país existente', async () => {
    const repo = dataSource.getRepository(Country);
    const country = await repo.save(
      repo.create({
        id: randomUUID(),
        shortName: 'AR',
        name: 'Argentina',
        userCreated: 'system',
        userUpdated: 'system',
      }),
    );

    const created = await expectCrudCycle(app, {
      base: '/api/state',
      create: { countryId: country.id, shortName: 'BA', name: 'Buenos Aires' },
      patch: { name: 'Buenos Aires (atual)' },
      patchField: 'name',
    });
    expect(created.countryId).toBe(country.id);
  });

  it('country com short_name duplicado responde 409', async () => {
    const first = await app.inject({
      method: 'POST',
      url: '/api/country',
      payload: { shortName: 'PT', name: 'Portugal' },
    });
    expect(first.statusCode).toBe(201);
    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/country',
      payload: { shortName: 'PT', name: 'Duplicado' },
    });
    expect(duplicate.statusCode).toBe(409);
  });

  it('state com país inexistente responde 409', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/state',
      payload: {
        countryId: '00000000-0000-0000-0000-000000000000',
        shortName: 'XX',
        name: 'Fantasma',
      },
    });
    expect(response.statusCode).toBe(409);
  });
});
