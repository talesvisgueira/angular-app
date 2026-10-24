import type { FastifyInstance } from 'fastify';
import type { LoginResponse } from '@monorepo/shared';
import { isLoginRequest } from '@monorepo/shared';
import { User } from '../entities/user.entity.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/login', async (request, reply) => {
    if (!isLoginRequest(request.body)) {
      return reply.status(400).send({ message: 'Dados de login inválidos.' });
    }

    const { email, password } = request.body;

    const userRepo = app.dataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { person: { email }, active: true },
      relations: { person: true },
    });

    if (!user || user.password !== password) {
      return reply.status(401).send({ message: 'Credenciais inválidas.' });
    }

    const response: LoginResponse = {
      token: `demo-token-${Date.now()}`,
      user: {
        id: user.id,
        name: user.person.name,
        email: user.person.email,
      },
    };

    return response;
  });
}
