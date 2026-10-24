import { afterAll, beforeAll, describe, it } from 'vitest';
import { createCrudTestApp, expectCrudCycle } from '../testing/harness.js';
import { systemRoutes } from './system.js';

describe('CRUD de system (integração com banco migrado)', () => {
  let app: Awaited<ReturnType<typeof createCrudTestApp>>['app'];
  let close: () => Promise<void>;

  beforeAll(async () => {
    const testApp = await createCrudTestApp((instance) => {
      instance.register(systemRoutes, { prefix: '/api/system' });
    });
    app = testApp.app;
    close = testApp.close;
  });

  afterAll(async () => {
    await close();
  });

  it('ciclo completo de sistema', async () => {
    await expectCrudCycle(app, {
      base: '/api/system',
      create: { name: 'Sistema Central', description: 'Catálogo principal' },
      patch: { name: 'Sistema Central (atual)' },
      patchField: 'name',
    });
  });
});
