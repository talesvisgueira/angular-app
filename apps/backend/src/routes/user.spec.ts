import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { Person } from '../entities/person.entity.js';
import { User } from '../entities/user.entity.js';
import { createCrudTestApp, TEST_AUDIT } from '../testing/harness.js';
import { userRoutes } from './user.js';

describe('API de usuários grava senha apenas como hash bcrypt', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let dataSource: Awaited<ReturnType<typeof createCrudTestApp>>['dataSource'];
  let close: () => Promise<void>;
  let userId: string;
  let personId: string;

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(userRoutes, { prefix: '/api/user' });
    });
    app = testApp.app;
    dataSource = testApp.dataSource;
    close = testApp.close;

    personId = randomUUID();
    await dataSource.getRepository(Person).save(
      dataSource.getRepository(Person).create({
        id: personId,
        code: 'USER1',
        name: 'Pessoa Usuário',
        shortName: 'PU1',
        email: 'usuario@example.com',
        ...TEST_AUDIT,
      }),
    );
  });

  afterAll(async () => {
    await close();
  });

  async function storedPassword(id: string): Promise<string> {
    const user = await dataSource.getRepository(User).findOneByOrFail({ id });
    return user.password;
  }

  it('POST grava hash bcrypt e não o texto plano', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/user',
      payload: { personId, username: 'novo', password: 'password123' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).not.toHaveProperty('password');

    const stored = await storedPassword(response.json().id);
    userId = response.json().id;
    expect(stored).not.toBe('password123');
    expect(stored.startsWith('$2')).toBe(true);
    expect(await bcrypt.compare('password123', stored)).toBe(true);
  });

  it('PATCH com nova senha grava hash da nova senha', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/user/${userId}`,
      payload: { password: 'novasenha456' },
    });
    expect(response.statusCode).toBe(200);

    const stored = await storedPassword(userId);
    expect(stored).not.toBe('novasenha456');
    expect(await bcrypt.compare('novasenha456', stored)).toBe(true);
  });

  it('PATCH sem alterar senha preserva o hash existente', async () => {
    const before = await storedPassword(userId);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/user/${userId}`,
      payload: { username: 'novo-nome' },
    });
    expect(response.statusCode).toBe(200);

    expect(await storedPassword(userId)).toBe(before);
  });
});
