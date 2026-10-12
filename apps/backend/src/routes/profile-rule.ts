import { buildCrudRoutes } from './crud-helpers.js';
import { ProfileRule } from '../entities/profile-rule.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    profileId: { type: 'string' },
    moduleRuleId: { type: 'string' },
    organizationId: { type: 'string' },
    userCreated: { type: 'string' },
    dataCreated: { type: 'string' },
    dataUpdated: { type: 'string' },
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    profileId: { type: 'string', maxLength: 36 },
    moduleRuleId: { type: 'string', maxLength: 36 },
    organizationId: { type: 'string', maxLength: 36 },
  },
  required: ['profileId', 'moduleRuleId', 'organizationId'],
  additionalProperties: false,
};

export const profileRuleRoutes = buildCrudRoutes({
  entity: ProfileRule,
  tag: 'profile_rule',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
