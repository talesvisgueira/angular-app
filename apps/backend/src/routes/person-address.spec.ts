import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Person } from '../entities/person.entity.js';
import { createCrudTestApp, expectCrudCycle, TEST_AUDIT } from '../testing/harness.js';
import { personAddressRoutes } from './person-address.js';

describe('CRUD de person_address (integração com banco migrado)', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let dataSource: Awaited<ReturnType<typeof createCrudTestApp>>['dataSource'];
  let close: () => Promise<void>;
  let personId: string;

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(personAddressRoutes, { prefix: '/api/person-address' });
    });
    app = testApp.app;
    dataSource = testApp.dataSource;
    close = testApp.close;

    const person = await dataSource.getRepository(Person).save(
      dataSource.getRepository(Person).create({
        id: randomUUID(),
        code: 'END01',
        name: 'Pessoa Endereço',
        shortName: 'PE1',
        email: 'endereco@example.com',
        ...TEST_AUDIT,
      }),
    );
    personId = person.id;
  });

  afterAll(async () => {
    await close();
  });

  it('ciclo completo de endereço vinculado a uma pessoa', async () => {
    const created = await expectCrudCycle(app, {
      base: '/api/person-address',
      create: { personId, address: 'Rua das Flores, 10', district: 'Centro', zipCode: '13010-000' },
      patch: { address: 'Rua das Flores, 20' },
      patchField: 'address',
    });
    expect(created.personId).toBe(personId);
  });

  it('endereço com cidade inexistente responde 409', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/person-address',
      payload: {
        personId,
        address: 'Rua Fantasmas, 1',
        district: 'Centro',
        cityId: '00000000-0000-0000-0000-000000000000',
      },
    });
    expect(response.statusCode).toBe(409);
  });
});
