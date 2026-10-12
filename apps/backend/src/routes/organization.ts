import { buildCrudRoutes } from './crud-helpers.js';
import { Organization } from '../entities/organization.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    endereco: { type: 'string' },
    bairro: { type: 'string' },
    countrystateId: { type: ['string', 'null'] },
    telefone: { type: ['string', 'null'] },
    parentId: { type: ['string', 'null'] },
    userCreated: { type: 'string' },
    dataCreated: { type: 'string' },
    dataUpdated: { type: 'string' },
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    endereco: { type: 'string', maxLength: 100 },
    bairro: { type: 'string', maxLength: 80 },
    countrystateId: { type: ['string', 'null'], maxLength: 36 },
    telefone: { type: ['string', 'null'], maxLength: 13 },
    parentId: { type: ['string', 'null'], maxLength: 36 },
  },
  required: ['id', 'endereco', 'bairro'],
  additionalProperties: false,
};

export const organizationRoutes = buildCrudRoutes({
  entity: Organization,
  tag: 'organization',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
