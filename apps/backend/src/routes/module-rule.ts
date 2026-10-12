import { buildCrudRoutes } from './crud-helpers.js';
import { ModuleRule } from '../entities/module-rule.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    moduleId: { type: 'string' },
    name: { type: 'string' },
    description: { type: ['string', 'null'] },
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
    moduleId: { type: 'string', maxLength: 36 },
    name: { type: 'string', maxLength: 80 },
    description: { type: ['string', 'null'], maxLength: 400 },
    organizationId: { type: 'string', maxLength: 36 },
  },
  required: ['moduleId', 'name', 'organizationId'],
  additionalProperties: false,
};

export const moduleRuleRoutes = buildCrudRoutes({
  entity: ModuleRule,
  tag: 'module_rule',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
