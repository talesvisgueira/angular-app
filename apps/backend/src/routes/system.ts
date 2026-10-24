import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { System } from '../entities/system.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: ['string', 'null'] },
    ...auditResponse,
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    name: { type: 'string', maxLength: 80 },
    description: { type: ['string', 'null'], maxLength: 400 },
  },
  required: ['name'],
  additionalProperties: false,
};

export const systemRoutes = buildCrudRoutes({
  entity: System,
  tag: 'system',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
