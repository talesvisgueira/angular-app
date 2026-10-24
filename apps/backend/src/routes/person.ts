import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { Person } from '../entities/person.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    code: { type: 'string' },
    name: { type: 'string' },
    shortName: { type: 'string' },
    description: { type: ['string', 'null'] },
    email: { type: 'string' },
    ...auditResponse,
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    code: { type: 'string', maxLength: 15 },
    name: { type: 'string', maxLength: 150 },
    shortName: { type: 'string', maxLength: 20 },
    description: { type: ['string', 'null'], maxLength: 400 },
    email: { type: 'string', maxLength: 100 },
  },
  required: ['code', 'name', 'shortName', 'email'],
  additionalProperties: false,
};

export const personRoutes = buildCrudRoutes({
  entity: Person,
  tag: 'person',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
