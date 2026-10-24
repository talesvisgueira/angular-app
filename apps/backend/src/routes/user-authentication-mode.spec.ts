import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Person } from '../entities/person.entity.js';
import { User } from '../entities/user.entity.js';
import { createCrudTestApp, expectCrudCycle, TEST_AUDIT } from '../testing/harness.js';
import { userAuthenticationModeRoutes } from './user-authentication-mode.js';

describe('CRUD de user_authentication_mode (integração com banco migrado)', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let dataSource: Awaited<ReturnType<typeof createCrudTestApp>>['dataSource'];
  let close: () => Promise<void>;
  let userId: string;

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(userAuthenticationModeRoutes, { prefix: '/api/user-authentication-mode' });
    });
    app = testApp.app;
    dataSource = testApp.dataSource;
    close = testApp.close;

    const person = await dataSource.getRepository(Person).save(
      dataSource.getRepository(Person).create({
        id: randomUUID(),
        code: 'UAM01',
        name: 'Pessoa Chave',
        shortName: 'PC1',
        email: 'chave@example.com',
        ...TEST_AUDIT,
      }),
    );
    const user = await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        id: randomUUID(),
        personId: person.id,
        username: 'chave',
        password: 'secret',
        ...TEST_AUDIT,
      }),
    );
    userId = user.id;
  });

  afterAll(async () => {
    await close();
  });

  it('ciclo completo de modo de autenticação do usuário', async () => {
    const created = await expectCrudCycle(app, {
      base: '/api/user-authentication-mode',
      create: { userId, userKey: 'token-1', keyValue: 'valor-token-1' },
      patch: { keyValue: 'valor-token-1 (atual)' },
      patchField: 'keyValue',
    });
    expect(created.userId).toBe(userId);
  });

  it('user_key duplicado responde 409', async () => {
    const first = await app.inject({
      method: 'POST',
      url: '/api/user-authentication-mode',
      payload: { userId, userKey: 'token-unico', keyValue: 'valor' },
    });
    expect(first.statusCode).toBe(201);
    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/user-authentication-mode',
      payload: { userId, userKey: 'token-unico', keyValue: 'outro valor' },
    });
    expect(duplicate.statusCode).toBe(409);
  });
});
