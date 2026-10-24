import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { City } from '../entities/city.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    stateId: { type: 'string' },
    shortName: { type: 'string' },
    name: { type: 'string' },
    ...auditResponse,
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    stateId: { type: 'string', maxLength: 36 },
    shortName: { type: 'string', maxLength: 15 },
    name: { type: 'string', maxLength: 80 },
  },
  required: ['stateId', 'shortName', 'name'],
  additionalProperties: false,
};

export const cityRoutes = buildCrudRoutes({
  entity: City,
  tag: 'city',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
