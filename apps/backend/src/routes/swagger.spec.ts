import Fastify from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerSwagger } from '../plugins/swagger.js';
import { cityRoutes } from './city.js';
import { countryRoutes } from './country.js';
import { moduleOrganizationRoutes } from './module-organization.js';
import { moduleRuleRoutes } from './module-rule.js';
import { moduleRoutes } from './module.js';
import { organizationModuleRoutes } from './organization-module.js';
import { organizationUserRoutes } from './organization-user.js';
import { organizationUserProfileRoutes } from './organization-user-profile.js';
import { organizationRoutes } from './organization.js';
import { personAddressRoutes } from './person-address.js';
import { personPhoneRoutes } from './person-phone.js';
import { personRoutes } from './person.js';
import { profileRuleRoutes } from './profile-rule.js';
import { profileRoutes } from './profile.js';
import { stateRoutes } from './state.js';
import { systemRoutes } from './system.js';
import { userAuthenticationModeRoutes } from './user-authentication-mode.js';
import { userRoutes } from './user.js';

const RESOURCE_ROUTES = [
  [personRoutes, '/api/person'],
  [userRoutes, '/api/user'],
  [organizationRoutes, '/api/organization'],
  [organizationUserRoutes, '/api/organization-user'],
  [organizationUserProfileRoutes, '/api/organization-user-profile'],
  [organizationModuleRoutes, '/api/organization-module'],
  [profileRoutes, '/api/profile'],
  [profileRuleRoutes, '/api/profile-rule'],
  [moduleRoutes, '/api/module'],
  [moduleRuleRoutes, '/api/module-rule'],
  [countryRoutes, '/api/country'],
  [stateRoutes, '/api/state'],
  [cityRoutes, '/api/city'],
  [personAddressRoutes, '/api/person-address'],
  [personPhoneRoutes, '/api/person-phone'],
  [systemRoutes, '/api/system'],
  [moduleOrganizationRoutes, '/api/module-organization'],
  [userAuthenticationModeRoutes, '/api/user-authentication-mode'],
] as const;

describe('Swagger/OpenAPI da API administrativa', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  async function buildApp() {
    const instance = Fastify({ logger: false });
    await registerSwagger(instance);
    for (const [routes, prefix] of RESOURCE_ROUTES) {
      await instance.register(routes, { prefix });
    }
    await instance.ready();
    return instance;
  }

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('documenta os 18 recursos CRUD com seus métodos', () => {
    const doc = app.swagger() as { paths: Record<string, Record<string, unknown>> };
    for (const [, prefix] of RESOURCE_ROUTES) {
      const operations = doc.paths[`${prefix}/`];
      expect(operations, `GET/POST ${prefix}/`).toBeDefined();
      expect(Object.keys(operations!).sort()).toEqual(['get', 'post']);
      const itemOperations = doc.paths[`${prefix}/{id}`];
      expect(itemOperations, `GET/PATCH/DELETE ${prefix}/{id}`).toBeDefined();
      expect(Object.keys(itemOperations!).sort()).toEqual(['delete', 'get', 'patch']);
    }
  });
});
