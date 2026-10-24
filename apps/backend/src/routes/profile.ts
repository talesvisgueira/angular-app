import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { Profile } from '../entities/profile.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
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
    name: { type: 'string', maxLength: 80 },
    description: { type: ['string', 'null'], maxLength: 400 },
    organizationId: { type: 'string', maxLength: 36 },
  },
  required: ['name', 'organizationId'],
  additionalProperties: false,
};

export const profileRoutes = buildCrudRoutes({
  entity: Profile,
  tag: 'profile',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
