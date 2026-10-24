import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { ModuleOrganization } from '../entities/module-organization.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    organizationId: { type: 'string' },
    moduleId: { type: 'string' },
    name: { type: 'string' },
    description: { type: ['string', 'null'] },
    ...auditResponse,
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    organizationId: { type: 'string', maxLength: 36 },
    moduleId: { type: 'string', maxLength: 36 },
    name: { type: 'string', maxLength: 80 },
    description: { type: ['string', 'null'], maxLength: 400 },
  },
  required: ['organizationId', 'moduleId', 'name'],
  additionalProperties: false,
};

export const moduleOrganizationRoutes = buildCrudRoutes({
  entity: ModuleOrganization,
  tag: 'module_organization',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
