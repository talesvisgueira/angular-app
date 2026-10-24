import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { User } from '../entities/user.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    personId: { type: 'string' },
    username: { type: 'string' },
    authenticationMode: { type: 'string' },
    ...auditResponse,
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    personId: { type: 'string', maxLength: 36 },
    username: { type: 'string', maxLength: 100 },
    password: { type: 'string', maxLength: 200 },
    authenticationMode: { type: 'string', maxLength: 20 },
    active: { type: 'boolean' },
  },
  required: ['personId', 'username', 'password'],
  additionalProperties: false,
};

export const userRoutes = buildCrudRoutes({
  entity: User,
  tag: 'user',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
