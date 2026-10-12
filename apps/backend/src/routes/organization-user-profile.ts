import { buildCrudRoutes } from './crud-helpers.js';
import { OrganizationUserProfile } from '../entities/organization-user-profile.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    organizationUserId: { type: 'string' },
    profileId: { type: 'string' },
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
    organizationUserId: { type: 'string', maxLength: 36 },
    profileId: { type: 'string', maxLength: 36 },
    organizationId: { type: 'string', maxLength: 36 },
  },
  required: ['organizationUserId', 'profileId', 'organizationId'],
  additionalProperties: false,
};

export const organizationUserProfileRoutes = buildCrudRoutes({
  entity: OrganizationUserProfile,
  tag: 'organization_user_profile',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
