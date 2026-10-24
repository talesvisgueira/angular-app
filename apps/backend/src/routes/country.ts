import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { Country } from '../entities/country.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    shortName: { type: 'string' },
    name: { type: 'string' },
    ...auditResponse,
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    shortName: { type: 'string', maxLength: 2 },
    name: { type: 'string', maxLength: 80 },
  },
  required: ['shortName', 'name'],
  additionalProperties: false,
};

export const countryRoutes = buildCrudRoutes({
  entity: Country,
  tag: 'country',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
