import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { PersonPhone } from '../entities/person-phone.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    personId: { type: ['string', 'null'] },
    countryId: { type: 'number' },
    code: { type: 'number' },
    number: { type: ['number', 'null'] },
    ...auditResponse,
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    personId: { type: ['string', 'null'], maxLength: 36 },
    countryId: { type: 'integer', minimum: 0 },
    code: { type: 'integer', minimum: 0 },
    number: { type: ['integer', 'null'], minimum: 0 },
  },
  required: ['countryId', 'code'],
  additionalProperties: false,
};

export const personPhoneRoutes = buildCrudRoutes({
  entity: PersonPhone,
  tag: 'person_phone',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
