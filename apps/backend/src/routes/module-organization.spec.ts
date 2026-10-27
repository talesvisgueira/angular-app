import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Module } from '../entities/module.entity.js';
import { Organization } from '../entities/organization.entity.js';
import { Person } from '../entities/person.entity.js';
import { System } from '../entities/system.entity.js';
import { createCrudTestApp, expectCrudCycle, TEST_AUDIT } from '../testing/harness.js';
import { moduleOrganizationRoutes } from './module-organization.js';

describe('CRUD de module_organization (integração com banco migrado)', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let dataSource: Awaited<ReturnType<typeof createCrudTestApp>>['dataSource'];
  let close: () => Promise<void>;
  let organizationId: string;
  let moduleId: string;

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(moduleOrganizationRoutes, { prefix: '/api/module-organization' });
    });
    app = testApp.app;
    dataSource = testApp.dataSource;
    close = testApp.close;

    const person = await dataSource.getRepository(Person).save(
      dataSource.getRepository(Person).create({
        id: randomUUID(),
        code: 'MOD01',
        name: 'Pessoa Módulo',
        shortName: 'PM1',
        email: 'modulo@example.com',
        ...TEST_AUDIT,
      }),
    );
    const organization = await dataSource
      .getRepository(Organization)
      .save(
        dataSource
          .getRepository(Organization)
          .create({ id: person.id, address: 'Rua 1', district: 'Centro', ...TEST_AUDIT }),
      );
    const system = await dataSource
      .getRepository(System)
      .save(
        dataSource
          .getRepository(System)
          .create({ id: randomUUID(), name: 'Sistema Base', ...TEST_AUDIT }),
      );
    const module = await dataSource.getRepository(Module).save(
      dataSource.getRepository(Module).create({
        id: randomUUID(),
        systemId: system.id,
        organizationId: organization.id,
        name: 'Módulo Base',
        ...TEST_AUDIT,
      }),
    );
    organizationId = organization.id;
    moduleId = module.id;
  });

  afterAll(async () => {
    await close();
  });

  it('ciclo completo de publicação de módulo para organização', async () => {
    const created = await expectCrudCycle(app, {
      base: '/api/module-organization',
      create: { organizationId, moduleId, name: 'Publicação Base' },
      patch: { name: 'Publicação Base (atual)' },
      patchField: 'name',
    });
    expect(created.organizationId).toBe(organizationId);
    expect(created.moduleId).toBe(moduleId);
  });

  it('publicação com módulo inexistente responde 409', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/module-organization',
      payload: {
        organizationId,
        moduleId: '00000000-0000-0000-0000-000000000000',
        name: 'Publicação Fantasma',
      },
    });
    expect(response.statusCode).toBe(409);
  });
});
