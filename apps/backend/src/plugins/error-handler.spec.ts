import 'reflect-metadata';
import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { QueryFailedError } from 'typeorm';
import { registerErrorHandler } from './error-handler.js';

function constraintError(): QueryFailedError {
  return new QueryFailedError('INSERT', [], {
    message: 'UNIQUE constraint failed: country.sigla (code = SQLITE_CONSTRAINT_UNIQUE)',
    name: 'SqliteError',
  } as Error);
}

describe('Tratamento centralizado de erros', () => {
  async function buildApp() {
    const app = Fastify({ logger: false });
    registerErrorHandler(app);

    app.post('/validation', async () => {
      const err = new Error('campo obrigatório ausente') as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    });

    app.get('/not-found', async (_request, reply) => {
      const err = new Error('Registro não encontrado.') as Error & { statusCode: number };
      err.statusCode = 404;
      return reply.send(err);
    });

    app.post('/constraint', async () => {
      throw constraintError();
    });

    app.post('/internal', async () => {
      throw new Error('boom');
    });

    await app.ready();
    return app;
  }

  it('mapear erro de validação para 400 com { message }', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'POST', url: '/validation' });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(typeof body.message).toBe('string');
    expect(JSON.stringify(body)).not.toContain('stack');
  });

  it('mapear registro inexistente para 404 com { message }', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/not-found' });
    expect(res.statusCode).toBe(404);
    expect(res.json().message).toBe('Registro não encontrado.');
  });

  it('mapear violação de FK/unicidade para 409 com { message }', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'POST', url: '/constraint' });
    expect(res.statusCode).toBe(409);
    expect(typeof res.json().message).toBe('string');
  });

  it('mapear erro interno para 500 sem expor stack', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'POST', url: '/internal' });
    expect(res.statusCode).toBe(500);
    const body = res.json();
    expect(body.message).toBe('Erro interno do servidor.');
    expect(JSON.stringify(body)).not.toContain('boom');
  });
});
