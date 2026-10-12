import { buildCrudRoutes } from './crud-helpers.js';
import { OrganizationModule } from '../entities/organization-module.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    organizationId: { type: 'string' },
    moduleId: { type: 'string' },
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
    organizationId: { type: 'string', maxLength: 36 },
    moduleId: { type: 'string', maxLength: 36 },
    active: { type: 'boolean' },
  },
  required: ['organizationId', 'moduleId'],
  additionalProperties: false,
};

export const organizationModuleRoutes = buildCrudRoutes({
  entity: OrganizationModule,
  tag: 'organization_module',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
