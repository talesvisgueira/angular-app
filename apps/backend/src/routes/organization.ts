import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { Organization } from '../entities/organization.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    address: { type: 'string' },
    district: { type: 'string' },
    cityId: { type: ['string', 'null'] },
    zipCode: { type: ['string', 'null'] },
    parentId: { type: ['string', 'null'] },
    ...auditResponse,
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    address: { type: 'string', maxLength: 100 },
    district: { type: 'string', maxLength: 80 },
    cityId: { type: ['string', 'null'], maxLength: 36 },
    zipCode: { type: ['string', 'null'], maxLength: 10 },
    parentId: { type: ['string', 'null'], maxLength: 36 },
  },
  required: ['id', 'address', 'district'],
  additionalProperties: false,
};

export const organizationRoutes = buildCrudRoutes({
  entity: Organization,
  tag: 'organization',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
