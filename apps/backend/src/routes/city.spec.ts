import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Country } from '../entities/country.entity.js';
import { State } from '../entities/state.entity.js';
import { createCrudTestApp, expectCrudCycle, TEST_AUDIT } from '../testing/harness.js';
import { cityRoutes } from './city.js';

describe('CRUD de city (integração com banco migrado)', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let dataSource: Awaited<ReturnType<typeof createCrudTestApp>>['dataSource'];
  let close: () => Promise<void>;
  let stateId: string;

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(cityRoutes, { prefix: '/api/city' });
    });
    app = testApp.app;
    dataSource = testApp.dataSource;
    close = testApp.close;

    const country = await dataSource.getRepository(Country).save(
      dataSource.getRepository(Country).create({ id: randomUUID(), shortName: 'BR', name: 'Brasil', ...TEST_AUDIT }),
    );
    const state = await dataSource.getRepository(State).save(
      dataSource
        .getRepository(State)
        .create({ id: randomUUID(), countryId: country.id, shortName: 'SP', name: 'São Paulo', ...TEST_AUDIT }),
    );
    stateId = state.id;
  });

  afterAll(async () => {
    await close();
  });

  it('ciclo completo de cidade vinculada a um estado', async () => {
    const created = await expectCrudCycle(app, {
      base: '/api/city',
      create: { stateId, shortName: 'CAMP', name: 'Campinas' },
      patch: { name: 'Campinas (atual)' },
      patchField: 'name',
    });
    expect(created.stateId).toBe(stateId);
  });

  it('cidade com estado inexistente responde 409', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/city',
      payload: { stateId: '00000000-0000-0000-0000-000000000000', shortName: 'FAN', name: 'Fantasma' },
    });
    expect(response.statusCode).toBe(409);
  });
});
