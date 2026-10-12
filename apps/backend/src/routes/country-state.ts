import { buildCrudRoutes } from './crud-helpers.js';
import { CountryState } from '../entities/country-state.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    countryId: { type: 'string' },
    sigla: { type: 'string' },
    nome: { type: 'string' },
    userCreated: { type: 'string' },
    dataCreated: { type: 'string' },
    dataUpdated: { type: 'string' },
  },
};

const body = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    countryId: { type: 'string', maxLength: 36 },
    sigla: { type: 'string', maxLength: 15 },
    nome: { type: 'string', maxLength: 80 },
  },
  required: ['countryId','countrySigla', 'countryNome', 'sigla', 'nome'],
  additionalProperties: false,
};

export const countryStateRoutes = buildCrudRoutes({
  entity: CountryState,
  tag: 'country_state',
  createBody: body,
  updateBody: { ...body, required: [ 'countrySigla', 'countryNome'] },
  response,
});
