import { buildCrudRoutes } from './crud-helpers.js';
import { Country } from '../entities/country.entity.js';

const response = {
  type: 'object',
  properties: {
    id: { type: 'string' },
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
    sigla: { type: 'string', maxLength: 15 },
    nome: { type: 'string', maxLength: 80 },
  },
  required: ['sigla', 'nome'],
  additionalProperties: false,
};

export const countryRoutes = buildCrudRoutes({
  entity: Country,
  tag: 'country',
  createBody: body,
  updateBody: { ...body, required: [] },
  response,
});
