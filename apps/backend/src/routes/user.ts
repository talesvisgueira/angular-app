import { buildCrudRoutes } from './crud-helpers.js';
import { User } from '../entities/user.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    username: { type: 'string' },
    active: { type: 'boolean' },
    userCreated: { type: 'string' },
    dataCreated: { type: 'string' },
    dataUpdated: { type: 'string' },
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    username: { type: 'string', maxLength: 100 },
    password: { type: 'string', maxLength: 200 },
    active: { type: 'boolean' },
  },
  required: ['id', 'username', 'password'],
  additionalProperties: false,
};

export const userRoutes = buildCrudRoutes({
  entity: User,
  tag: 'user',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
