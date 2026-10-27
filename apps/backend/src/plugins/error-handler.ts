import type { FastifyInstance, FastifyError } from 'fastify';
import { QueryFailedError } from 'typeorm';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error.validation) {
      return reply.status(400).send({ message: `Requisição inválida: ${error.message}` });
    }

    const statusCode = error.statusCode ?? 500;

    if (statusCode === 404) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof QueryFailedError) {
      const driverError = (error as { driverError?: Error & { code?: string } }).driverError;
      const isConstraint =
        driverError?.message?.includes('constraint') === true ||
        driverError?.code?.startsWith('SQLITE_CONSTRAINT') === true;
      if (isConstraint) {
        request.log.warn(driverError?.message);
        return reply.status(409).send({
          message: 'Violação de integridade referencial ou de unicidade.',
        });
      }
      request.log.error(error);
      return reply.status(500).send({ message: 'Erro interno do servidor.' });
    }

    if (statusCode >= 500) {
      request.log.error(error);
      return reply.status(500).send({ message: 'Erro interno do servidor.' });
    }

    request.log.warn(error.message);
    return reply.status(statusCode).send({ message: error.message });
  });
}
