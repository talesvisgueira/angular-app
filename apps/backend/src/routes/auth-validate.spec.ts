import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import { createCrudTestApp } from '../testing/harness.js';
import { getJwtSecret, signSessionToken, TOKEN_TTL_SECONDS } from '../config/jwt.js';
import { authRoutes } from './auth.js';

function expiredToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ email: 'login@example.com', name: 'Pessoa Login', profiles: [] })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(randomUUID())
    .setIssuedAt(now - TOKEN_TTL_SECONDS - 60)
    .setExpirationTime(now - 60)
    .sign(getJwtSecret());
}

describe('POST /api/auth/validate', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let close: () => Promise<void>;

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(authRoutes, { prefix: '/api' });
    });
    app = testApp.app;
    close = testApp.close;
  });

  afterAll(async () => {
    await close();
  });

  it('token válido responde 200 com os claims', async () => {
    const token = await signSessionToken({
      sub: randomUUID(),
      email: 'login@example.com',
      name: 'Pessoa Login',
      profiles: ['Administrador'],
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/validate',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(typeof body.sub).toBe('string');
    expect(body.email).toBe('login@example.com');
    expect(body.name).toBe('Pessoa Login');
    expect(body.profiles).toEqual(['Administrador']);
    expect(typeof body.exp).toBe('number');
  });

  it('token expirado responde 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/validate',
      headers: { authorization: `Bearer ${await expiredToken()}` },
    });

    expect(response.statusCode).toBe(401);
    expect(typeof response.json().message).toBe('string');
  });

  it('header Authorization ausente responde 401', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/auth/validate' });

    expect(response.statusCode).toBe(401);
    expect(typeof response.json().message).toBe('string');
  });

  it('token inválido (assinatura diferente ou malformado) responde 401', async () => {
    for (const token of ['nao-e-um-jwt', 'a.b.c', 'sem.bearer']) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/validate',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(401);
    }
  });
});
