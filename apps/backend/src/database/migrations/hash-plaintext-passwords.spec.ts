import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { Person } from '../../entities/person.entity.js';
import { createCrudTestApp, TEST_AUDIT } from '../../testing/harness.js';
import { authRoutes } from '../../routes/auth.js';
import { HashPlaintextPasswords1700000004000 } from './1700000004000-HashPlaintextPasswords.js';

const PLAINTEXT_PASSWORD = 'legado123';

describe('Migration HashPlaintextPasswords', () => {
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

    const personId = randomUUID();
    await dataSource.getRepository(Person).save(
      dataSource.getRepository(Person).create({
        id: personId,
        code: 'LEGADO',
        name: 'Pessoa Legado',
        shortName: 'LG1',
        email: 'legado@example.com',
        ...TEST_AUDIT,
      }),
    );

    userId = randomUUID();
    // INSERT bruto para burlar o hook da entidade e simular uma linha legada
    // gravada antes da mudança (senha em texto plano).
    await dataSource.query(
      `INSERT INTO "user" ("id", "person_id", "username", "password", "user_created", "data_created", "user_updated", "data_updated")
       VALUES (?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))`,
      [userId, personId, 'legado', PLAINTEXT_PASSWORD, 'system', 'system'],
    );
  });

  afterAll(async () => {
    await close();
  });

  async function runMigration(): Promise<void> {
    const runner = dataSource.createQueryRunner();
    try {
      await new HashPlaintextPasswords1700000004000().up(runner);
    } finally {
      await runner.release();
    }
  }

  async function storedPassword(): Promise<string> {
    const rows = await dataSource.query(`SELECT "password" FROM "user" WHERE "id" = ?`, [userId]);
    return rows[0].password as string;
  }

  it('converte senha em texto plano para hash e o login autentica com ela', async () => {
    await runMigration();

    const password = await storedPassword();
    expect(password).not.toBe(PLAINTEXT_PASSWORD);
    expect(password.startsWith('$2')).toBe(true);
    expect(await bcrypt.compare(PLAINTEXT_PASSWORD, password)).toBe(true);

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'legado@example.com', password: PLAINTEXT_PASSWORD },
    });
    expect(login.statusCode).toBe(200);
  });

  it('é idempotente: hash já convertido não muda novamente', async () => {
    const before = await storedPassword();
    await runMigration();
    expect(await storedPassword()).toBe(before);
  });
});
