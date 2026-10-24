import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { UserAuthenticationMode } from '../entities/user-authentication-mode.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    userKey: { type: 'string' },
    keyValue: { type: 'string' },
    ...auditResponse,
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    userId: { type: 'string', maxLength: 36 },
    userKey: { type: 'string', maxLength: 100 },
    keyValue: { type: 'string', maxLength: 400 },
  },
  required: ['userId', 'userKey', 'keyValue'],
  additionalProperties: false,
};

export const userAuthenticationModeRoutes = buildCrudRoutes({
  entity: UserAuthenticationMode,
  tag: 'user_authentication_mode',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
