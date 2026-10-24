import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Person } from '../entities/person.entity.js';
import { createCrudTestApp, expectCrudCycle, TEST_AUDIT } from '../testing/harness.js';
import { personPhoneRoutes } from './person-phone.js';

describe('CRUD de person_phone (integração com banco migrado)', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let dataSource: Awaited<ReturnType<typeof createCrudTestApp>>['dataSource'];
  let close: () => Promise<void>;
  let personId: string;

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(personPhoneRoutes, { prefix: '/api/person-phone' });
    });
    app = testApp.app;
    dataSource = testApp.dataSource;
    close = testApp.close;

    const person = await dataSource.getRepository(Person).save(
      dataSource.getRepository(Person).create({
        id: randomUUID(),
        code: 'TEL01',
        name: 'Pessoa Telefone',
        shortName: 'PT1',
        email: 'telefone@example.com',
        ...TEST_AUDIT,
      }),
    );
    personId = person.id;
  });

  afterAll(async () => {
    await close();
  });

  it('ciclo completo de telefone vinculado a uma pessoa', async () => {
    const created = await expectCrudCycle(app, {
      base: '/api/person-phone',
      create: { personId, countryId: 55, code: 19, number: 999999999 },
      patch: { code: 11 },
      patchField: 'code',
    });
    expect(created.personId).toBe(personId);
    expect(created.countryId).toBe(55);
  });

  it('telefone com pessoa inexistente responde 409', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/person-phone',
      payload: {
        personId: '00000000-0000-0000-0000-000000000000',
        countryId: 55,
        code: 19,
      },
    });
    expect(response.statusCode).toBe(409);
  });
});
