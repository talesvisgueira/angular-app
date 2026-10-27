import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { parseJwt } from '@monorepo/shared';
import { Organization } from '../entities/organization.entity.js';
import { OrganizationUser } from '../entities/organization-user.entity.js';
import { OrganizationUserProfile } from '../entities/organization-user-profile.entity.js';
import { Person } from '../entities/person.entity.js';
import { Profile } from '../entities/profile.entity.js';
import { User } from '../entities/user.entity.js';
import { createCrudTestApp, TEST_AUDIT } from '../testing/harness.js';
import { authRoutes } from './auth.js';

describe('Login autenticado pelo banco de dados', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let dataSource: Awaited<ReturnType<typeof createCrudTestApp>>['dataSource'];
  let close: () => Promise<void>;
  let userId: string;
  let userIdSemPerfis: string;

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
    // Senha em texto plano no seed: o hook da entidade grava o hash bcrypt.
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

    const personSemPerfis = await dataSource.getRepository(Person).save(
      dataSource.getRepository(Person).create({
        id: randomUUID(),
        code: 'LOGIN3',
        name: 'Pessoa Sem Perfis',
        shortName: 'PS1',
        email: 'semperfis@example.com',
        ...TEST_AUDIT,
      }),
    );
    const userSemPerfis = await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        id: randomUUID(),
        personId: personSemPerfis.id,
        username: 'semperfis',
        password: 'password123',
        ...TEST_AUDIT,
      }),
    );
    userIdSemPerfis = userSemPerfis.id;

    const orgPerson = await dataSource.getRepository(Person).save(
      dataSource.getRepository(Person).create({
        id: randomUUID(),
        code: 'LOGIN2',
        name: 'Pessoa Organização',
        shortName: 'PO1',
        email: 'org@example.com',
        ...TEST_AUDIT,
      }),
    );
    const organization = await dataSource.getRepository(Organization).save(
      dataSource.getRepository(Organization).create({
        id: orgPerson.id,
        address: 'Rua 1',
        district: 'Centro',
        ...TEST_AUDIT,
      }),
    );
    const profile = await dataSource.getRepository(Profile).save(
      dataSource.getRepository(Profile).create({
        id: randomUUID(),
        name: 'Administrador',
        organizationId: organization.id,
        ...TEST_AUDIT,
      }),
    );
    const organizationUser = await dataSource.getRepository(OrganizationUser).save(
      dataSource.getRepository(OrganizationUser).create({
        id: randomUUID(),
        organizationId: organization.id,
        userId: user.id,
        ...TEST_AUDIT,
      }),
    );
    await dataSource.getRepository(OrganizationUserProfile).save(
      dataSource.getRepository(OrganizationUserProfile).create({
        id: randomUUID(),
        organizationUserId: organizationUser.id,
        profileId: profile.id,
        ...TEST_AUDIT,
      }),
    );
  });

  afterAll(async () => {
    await close();
  });

  it('senha do usuário é persistida como hash bcrypt', async () => {
    const stored = await dataSource.getRepository(User).findOneByOrFail({ id: userId });
    expect(stored.password).not.toBe('password123');
    expect(stored.password.startsWith('$2')).toBe(true);
    expect(await bcrypt.compare('password123', stored.password)).toBe(true);
  });

  it('credenciais válidas respondem 200 com token, identidade e perfis', async () => {
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
    expect(body.user.profiles).toEqual(['Administrador']);
  });

  it('token emitido é um JWT com claims e exp de 20 minutos', async () => {
    const before = Math.floor(Date.now() / 1000);
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'login@example.com', password: 'password123' },
    });
    expect(response.statusCode).toBe(200);

    const claims = parseJwt(response.json().token);
    expect(claims).not.toBeNull();
    expect(claims!.sub).toBe(userId);
    expect(claims!.email).toBe('login@example.com');
    expect(claims!.name).toBe('Pessoa Login');
    expect(claims!.profiles).toEqual(['Administrador']);
    expect(claims!.exp).toBeGreaterThanOrEqual(before + 19 * 60);
    expect(claims!.exp).toBeLessThanOrEqual(before + 21 * 60);
  });

  it('usuário sem perfis vinculados recebe profiles vazio', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'semperfis@example.com', password: 'password123' },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.user.id).toBe(userIdSemPerfis);
    expect(body.user.profiles).toEqual([]);
    expect(parseJwt(body.token)!.profiles).toEqual([]);
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
        code: 'LOGIN4',
        name: 'Pessoa Inativa',
        shortName: 'PI1',
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

describe('Verificação de usuários cadastrados (GET /api/auth/has-users)', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let dataSource: Awaited<ReturnType<typeof createCrudTestApp>>['dataSource'];
  let close: () => Promise<void>;

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(authRoutes, { prefix: '/api' });
    });
    app = testApp.app;
    dataSource = testApp.dataSource;
    close = testApp.close;
  });

  afterAll(async () => {
    await close();
  });

  async function seedUser(email: string, username: string, active = true): Promise<void> {
    const person = await dataSource.getRepository(Person).save(
      dataSource.getRepository(Person).create({
        id: randomUUID(),
        code: username.toUpperCase().slice(0, 10),
        name: `Pessoa ${username}`,
        shortName: username.slice(0, 18),
        email,
        ...TEST_AUDIT,
      }),
    );
    await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        id: randomUUID(),
        personId: person.id,
        username,
        password: 'password123',
        active,
        ...TEST_AUDIT,
      }),
    );
  }

  it('base vazia responde hasUsers false', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/auth/has-users' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ hasUsers: false });
  });

  it('base com usuário ativo responde hasUsers true', async () => {
    await seedUser('ativo@example.com', 'ativo');

    const response = await app.inject({ method: 'GET', url: '/api/auth/has-users' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ hasUsers: true });
  });

  it('base com usuário inativo também responde hasUsers true', async () => {
    await seedUser('inativo@example.com', 'inativohu', false);

    const response = await app.inject({ method: 'GET', url: '/api/auth/has-users' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ hasUsers: true });
  });
});

describe('Cadastro inicial (POST /api/auth/setup) — caminho feliz', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let dataSource: Awaited<ReturnType<typeof createCrudTestApp>>['dataSource'];
  let close: () => Promise<void>;

  const setupPayload = {
    organization: { name: 'Organização Alfa', email: 'contato@alfa.com.br' },
    admin: {
      name: 'Maria Souza',
      email: 'maria@alfa.com.br',
      username: 'maria',
      password: 'password123',
    },
  };

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(authRoutes, { prefix: '/api' });
    });
    app = testApp.app;
    dataSource = testApp.dataSource;
    close = testApp.close;
  });

  afterAll(async () => {
    await close();
  });

  it('cadastra o primeiro administrador e responde 201 com a sessão', async () => {
    const before = Math.floor(Date.now() / 1000);
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/setup',
      payload: setupPayload,
    });
    expect(response.statusCode).toBe(201);

    const body = response.json();
    expect(body.user.name).toBe('Maria Souza');
    expect(body.user.email).toBe('maria@alfa.com.br');
    expect(body.user.profiles).toEqual(['Administrador']);

    const claims = parseJwt(body.token);
    expect(claims).not.toBeNull();
    expect(claims!.email).toBe('maria@alfa.com.br');
    expect(claims!.name).toBe('Maria Souza');
    expect(claims!.profiles).toEqual(['Administrador']);
    expect(claims!.exp).toBeGreaterThanOrEqual(before + 19 * 60);
    expect(claims!.exp).toBeLessThanOrEqual(before + 21 * 60);
  });

  it('cria todos os registros com defaults, auditoria e hash de senha', async () => {
    const personOrg = await dataSource
      .getRepository(Person)
      .findOneByOrFail({ email: 'contato@alfa.com.br' });
    expect(personOrg.code.length).toBeLessThanOrEqual(15);
    expect(personOrg.code.length).toBeGreaterThan(0);
    expect(personOrg.shortName.length).toBeLessThanOrEqual(20);
    expect(personOrg.shortName.length).toBeGreaterThan(0);
    expect(personOrg.userCreated).toBe('system');

    const organization = await dataSource
      .getRepository(Organization)
      .findOneByOrFail({ id: personOrg.id });
    expect(organization.address).toBe('NÃO INFORMADO');
    expect(organization.district).toBe('NÃO INFORMADO');
    expect(organization.cityId).toBeNull();

    const personAdmin = await dataSource
      .getRepository(Person)
      .findOneByOrFail({ email: 'maria@alfa.com.br' });
    const user = await dataSource.getRepository(User).findOneByOrFail({ personId: personAdmin.id });
    expect(user.username).toBe('maria');
    expect(user.password).not.toBe('password123');
    expect(user.password.startsWith('$2')).toBe(true);
    expect(await bcrypt.compare('password123', user.password)).toBe(true);

    const organizationUser = await dataSource
      .getRepository(OrganizationUser)
      .findOneByOrFail({ userId: user.id, organizationId: organization.id });
    const profile = await dataSource
      .getRepository(Profile)
      .findOneByOrFail({ organizationId: organization.id, name: 'Administrador' });
    const link = await dataSource
      .getRepository(OrganizationUserProfile)
      .findOneByOrFail({ organizationUserId: organizationUser.id, profileId: profile.id });
    expect(link.active).toBe(true);
    expect(profile.userCreated).toBe('system');
    expect(organizationUser.userCreated).toBe('system');
    expect(link.userCreated).toBe('system');
  });

  it('administrador criado consegue logar com as credenciais cadastradas', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'maria@alfa.com.br', password: 'password123' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().user.profiles).toEqual(['Administrador']);
  });
});

describe('Cadastro inicial (POST /api/auth/setup) — recusas e conflitos', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let dataSource: Awaited<ReturnType<typeof createCrudTestApp>>['dataSource'];
  let close: () => Promise<void>;

  const validPayload = {
    organization: { name: 'Organização Beta', email: 'contato@beta.com.br' },
    admin: {
      name: 'João Pereira',
      email: 'joao@beta.com.br',
      username: 'joao',
      password: 'password123',
    },
  };

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(authRoutes, { prefix: '/api' });
    });
    app = testApp.app;
    dataSource = testApp.dataSource;
    close = testApp.close;
  });

  afterAll(async () => {
    await close();
  });

  async function personCount(): Promise<number> {
    return dataSource.getRepository(Person).count();
  }

  async function seedPerson(email: string): Promise<void> {
    await dataSource.getRepository(Person).save(
      dataSource.getRepository(Person).create({
        id: randomUUID(),
        code: email.slice(0, 10).toUpperCase(),
        name: `Pessoa ${email}`,
        shortName: email.slice(0, 18),
        email,
        ...TEST_AUDIT,
      }),
    );
  }

  it('corpo inválido responde 400 sem criar registros', async () => {
    const before = await personCount();

    const missing = await app.inject({ method: 'POST', url: '/api/auth/setup', payload: {} });
    expect(missing.statusCode).toBe(400);
    expect(typeof missing.json().message).toBe('string');

    const shortPassword = await app.inject({
      method: 'POST',
      url: '/api/auth/setup',
      payload: {
        organization: validPayload.organization,
        admin: { ...validPayload.admin, password: '123' },
      },
    });
    expect(shortPassword.statusCode).toBe(400);

    const invalidEmail = await app.inject({
      method: 'POST',
      url: '/api/auth/setup',
      payload: {
        organization: validPayload.organization,
        admin: { ...validPayload.admin, email: 'sem-arroba' },
      },
    });
    expect(invalidEmail.statusCode).toBe(400);

    expect(await personCount()).toBe(before);
  });

  it('email da organização já utilizado responde 409 sem criar registros', async () => {
    await seedPerson('existente@beta.com.br');
    const before = await personCount();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/setup',
      payload: {
        organization: { name: 'Organização Gama', email: 'existente@beta.com.br' },
        admin: validPayload.admin,
      },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json().message).toBe('Email já utilizado.');
    expect(await personCount()).toBe(before);
  });

  it('email do administrador já utilizado responde 409 sem criar registros', async () => {
    const before = await personCount();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/setup',
      payload: {
        organization: validPayload.organization,
        admin: { ...validPayload.admin, email: 'existente@beta.com.br', username: 'outro' },
      },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json().message).toBe('Email já utilizado.');
    expect(await personCount()).toBe(before);
  });

  it('cadastros quase simultâneos criam registros no máximo uma vez', async () => {
    const payload = {
      organization: { name: 'Organização Delta', email: 'contato@delta.com.br' },
      admin: {
        name: 'Ana Lima',
        email: 'ana@delta.com.br',
        username: 'ana',
        password: 'password123',
      },
    };

    const [first, second] = await Promise.all([
      app.inject({ method: 'POST', url: '/api/auth/setup', payload }),
      app.inject({ method: 'POST', url: '/api/auth/setup', payload }),
    ]);

    const statuses = [first.statusCode, second.statusCode].sort();
    expect(statuses).toEqual([201, 409]);
    expect(await dataSource.getRepository(User).count()).toBe(1);
    expect(await dataSource.getRepository(Organization).count()).toBe(1);
  });

  it('base já populada com usuário responde 409 sem criar registros', async () => {
    const before = await personCount();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/setup',
      payload: validPayload,
    });
    expect(response.statusCode).toBe(409);
    expect(response.json().message).toBe('O sistema já possui usuário cadastrado.');
    expect(await personCount()).toBe(before);
  });

  it('username já utilizado responde 409 sem criar registros', async () => {
    const before = await personCount();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/setup',
      payload: {
        organization: validPayload.organization,
        admin: { ...validPayload.admin, username: 'ana', email: 'nova@beta.com.br' },
      },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json().message).toBe('Username já utilizado.');
    expect(await personCount()).toBe(before);
  });
});
