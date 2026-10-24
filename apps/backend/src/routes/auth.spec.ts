import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Person } from '../entities/person.entity.js';
import { User } from '../entities/user.entity.js';
import { createCrudTestApp, TEST_AUDIT } from '../testing/harness.js';
import { authRoutes } from './auth.js';

describe('Login autenticado pelo banco de dados', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let dataSource: Awaited<ReturnType<typeof createCrudTestApp>>['dataSource'];
  let close: () => Promise<void>;
  let userId: string;

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(authRoutes, { prefix: '/api' });
    });
    app = testApp.app;
    dataSource = testApp.dataSource;
    close = testApp.close;

    const person = await dataSource.getRepository(Person).save(
      dataSource.getRepository(Person).create({
        id: randomUUID(),
        code: 'LOGIN1',
        name: 'Pessoa Login',
        shortName: 'PL1',
        email: 'login@example.com',
        ...TEST_AUDIT,
      }),
    );
    const user = await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        id: randomUUID(),
        personId: person.id,
        username: 'login',
        password: 'password123',
        ...TEST_AUDIT,
      }),
    );
    userId = user.id;
  });

  afterAll(async () => {
    await close();
  });

  it('credenciais válidas respondem 200 com token e identidade da pessoa', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'login@example.com', password: 'password123' },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.token).toBeTruthy();
    expect(body.user.id).toBe(userId);
    expect(body.user.name).toBe('Pessoa Login');
    expect(body.user.email).toBe('login@example.com');
  });

  it('email sem usuário correspondente responde 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'desconhecido@example.com', password: 'password123' },
    });
    expect(response.statusCode).toBe(401);
    expect(typeof response.json().message).toBe('string');
  });

  it('senha incorreta responde 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'login@example.com', password: 'senha-errada' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('usuário inativo responde 401', async () => {
    const person = await dataSource.getRepository(Person).save(
      dataSource.getRepository(Person).create({
        id: randomUUID(),
        code: 'LOGIN2',
        name: 'Pessoa Inativa',
        shortName: 'PL2',
        email: 'inativo@example.com',
        ...TEST_AUDIT,
      }),
    );
    await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        id: randomUUID(),
        personId: person.id,
        username: 'inativo',
        password: 'password123',
        active: false,
        ...TEST_AUDIT,
      }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'inativo@example.com', password: 'password123' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('corpo inválido responde 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'login@example.com', password: '123' },
    });
    expect(response.statusCode).toBe(400);
    expect(typeof response.json().message).toBe('string');
  });
});
