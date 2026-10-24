import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { OrganizationUser } from '../entities/organization-user.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    organizationId: { type: 'string' },
    userId: { type: 'string' },
    ...auditResponse,
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    organizationId: { type: 'string', maxLength: 36 },
    userId: { type: 'string', maxLength: 36 },
  },
  required: ['organizationId', 'userId'],
  additionalProperties: false,
};

export const organizationUserRoutes = buildCrudRoutes({
  entity: OrganizationUser,
  tag: 'organization_user',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
