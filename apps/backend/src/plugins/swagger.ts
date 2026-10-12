import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'API de Administração',
        description: 'CRUD das entidades do modelo RBAC e geográfico.',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:3000' }],
      tags: [
        { name: 'auth', description: 'Autenticação (demo)' },
        { name: 'health', description: 'Saúde do serviço' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none'
    }
  });
}
