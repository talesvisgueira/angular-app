import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type { ObjectType } from 'typeorm';
import { ObjectLiteral } from 'typeorm';

export const SYSTEM_USER = 'system';

/** Propriedades de auditoria/ativação presentes em toda resposta de CRUD. */
export const auditResponse = {
  active: { type: 'boolean' },
  userCreated: { type: 'string' },
  userUpdated: { type: 'string' },
  dataCreated: { type: 'string' },
  dataUpdated: { type: 'string' },
} as const;

export interface Pagination {
  limit: number;
  offset: number;
}

export function parsePagination(query: Record<string, unknown>): Pagination {
  const limit = Number(query.limit ?? 20);
  const offset = Number(query.offset ?? 0);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw Object.assign(new Error('Parâmetro limit inválido (1 a 100).'), { statusCode: 400 });
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw Object.assign(new Error('Parâmetro offset inválido (>= 0).'), { statusCode: 400 });
  }

  return { limit, offset };
}

export interface CrudRouteOptions<TEntity extends ObjectLiteral> {
  entity: ObjectType<TEntity>;
  tag: string;
  createBody: Record<string, unknown>;
  updateBody: Record<string, unknown>;
  response: Record<string, unknown>;
  prepare?: (body: Record<string, unknown>, request: FastifyRequest) => Record<string, unknown>;
}

export function withAudit(body: Record<string, unknown>): Record<string, unknown> {
  const prepared = { ...body };
  if (!prepared.id) {
    prepared.id = randomUUID();
  }
  prepared.userCreated = SYSTEM_USER;
  prepared.userUpdated = SYSTEM_USER;
  if (prepared.active === undefined) {
    prepared.active = true;
  }
  return prepared;
}

export function buildCrudRoutes<TEntity extends ObjectLiteral>(
  options: CrudRouteOptions<TEntity>,
): FastifyPluginAsync {
  const { entity, tag, createBody, updateBody, response } = options;

  const listQuerystring = {
    type: 'object',
    properties: {
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
  };

  const listResponse = {
    type: 'object',
    properties: {
      total: { type: 'integer' },
      items: { type: 'array', items: response },
    },
  };

  const errorResponse = {
    type: 'object',
    properties: { message: { type: 'string' } },
  };

  const idParam = {
    type: 'object',
    properties: { id: { type: 'string', maxLength: 36 } },
    required: ['id'],
  };

  return async function crudRoutes(app): Promise<void> {
    const repository = () => app.dataSource.getRepository(entity);

    app.post(
      '/',
      {
        schema: {
          tags: [tag],
          body: createBody,
          response: {
            201: response,
            404: errorResponse,
            409: errorResponse,
          },
        },
      },
      async (request, reply) => {
        const raw = options.prepare
          ? options.prepare(request.body as Record<string, unknown>, request)
          : (request.body as Record<string, unknown>);
        raw.id = randomUUID();
        const body = withAudit(raw);
        const saved = await repository().save(repository().create(body as TEntity));
        return reply.status(201).send(saved);
      },
    );

    app.get(
      '/',
      {
        schema: {
          tags: [tag],
          querystring: listQuerystring,
          response: { 200: listResponse },
        },
      },
      async (request) => {
        const { limit, offset } = parsePagination(request.query as Record<string, unknown>);
        const repo = repository();
        const [items, total] = await repo.findAndCount({ skip: offset, take: limit });
        return { total, items };
      },
    );

    app.get(
      '/:id',
      {
        schema: {
          tags: [tag],
          params: idParam,
          response: { 200: response, 404: errorResponse },
        },
      },
      async (request, reply) => {
        const { id } = request.params as { id: string };
        const found = await repository().findOneBy({ id } as never);
        if (!found) {
          return reply.status(404).send({ message: 'Registro não encontrado.' });
        }
        return found;
      },
    );

    app.patch(
      '/:id',
      {
        schema: {
          tags: [tag],
          params: idParam,
          body: updateBody,
          response: { 200: response, 404: errorResponse, 409: errorResponse },
        },
      },
      async (request, reply) => {
        const { id } = request.params as { id: string };
        const repo = repository();
        const found = await repo.findOneBy({ id } as never);
        if (!found) {
          return reply.status(404).send({ message: 'Registro não encontrado.' });
        }
        Object.assign(found, request.body);
        (found as Record<string, unknown>).userUpdated = SYSTEM_USER;
        const saved = await repo.save(found);
        return saved;
      },
    );

    app.delete(
      '/:id',
      {
        schema: {
          tags: [tag],
          params: idParam,
          response: { 204: { type: 'null' }, 404: errorResponse, 409: errorResponse },
        },
      },
      async (request, reply) => {
        const { id } = request.params as { id: string };
        const repo = repository();
        const found = await repo.findOneBy({ id } as never);
        if (!found) {
          return reply.status(404).send({ message: 'Registro não encontrado.' });
        }
        await repo.remove(found);
        return reply.status(204).send();
      },
    );
  };
}
