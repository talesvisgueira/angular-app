import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { State } from '../entities/state.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    countryId: { type: 'string' },
    shortName: { type: 'string' },
    name: { type: 'string' },
    ...auditResponse,
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    countryId: { type: 'string', maxLength: 36 },
    shortName: { type: 'string', maxLength: 2 },
    name: { type: 'string', maxLength: 80 },
  },
  required: ['countryId', 'shortName', 'name'],
  additionalProperties: false,
};

export const stateRoutes = buildCrudRoutes({
  entity: State,
  tag: 'state',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
