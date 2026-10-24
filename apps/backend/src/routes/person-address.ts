import { auditResponse, buildCrudRoutes } from './crud-helpers.js';
import { PersonAddress } from '../entities/person-address.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    personId: { type: ['string', 'null'] },
    address: { type: 'string' },
    district: { type: 'string' },
    zipCode: { type: ['string', 'null'] },
    cityId: { type: ['string', 'null'] },
    countryId: { type: ['string', 'null'] },
    stateId: { type: ['string', 'null'] },
    ...auditResponse,
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    personId: { type: ['string', 'null'], maxLength: 36 },
    address: { type: 'string', maxLength: 100 },
    district: { type: 'string', maxLength: 80 },
    zipCode: { type: ['string', 'null'], maxLength: 10 },
    cityId: { type: ['string', 'null'], maxLength: 36 },
    countryId: { type: ['string', 'null'], maxLength: 36 },
    stateId: { type: ['string', 'null'], maxLength: 36 },
  },
  required: ['address', 'district'],
  additionalProperties: false,
};

export const personAddressRoutes = buildCrudRoutes({
  entity: PersonAddress,
  tag: 'person_address',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
