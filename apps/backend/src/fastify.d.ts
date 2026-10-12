import type { DataSource } from 'typeorm';

declare module 'fastify' {
  interface FastifyInstance {
    dataSource: DataSource;
  }
}
