import type { FastifyInstance } from 'fastify';
import type { LoginResponse } from '@monorepo/shared';
import { isLoginRequest } from '@monorepo/shared';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/login', async (request, reply) => {
    if (!isLoginRequest(request.body)) {
      return reply.status(400).send({ message: 'Dados de login inválidos.' });
    }

    const { email, password } = request.body;

    if (password !== 'password123') {
      return reply.status(401).send({ message: 'Credenciais inválidas.' });
    }

    const [name = email] = email.split('@');

    const response: LoginResponse = {
      token: `demo-token-${Date.now()}`,
      user: {
        id: '1',
        name,
        email,
      },
    };

    return response;
  });
}
