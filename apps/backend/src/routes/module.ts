import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { Module } from '../entities/module.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    systemId: { type: 'string' },
    name: { type: 'string' },
    description: { type: ['string', 'null'] },
    organizationId: { type: 'string' },
    ...auditResponse,
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    systemId: { type: 'string', maxLength: 36 },
    name: { type: 'string', maxLength: 80 },
    description: { type: ['string', 'null'], maxLength: 400 },
    organizationId: { type: 'string', maxLength: 36 },
  },
  required: ['systemId', 'name', 'organizationId'],
  additionalProperties: false,
};

export const moduleRoutes = buildCrudRoutes({
  entity: Module,
  tag: 'module',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
