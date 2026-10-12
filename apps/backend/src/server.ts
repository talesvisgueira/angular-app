import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authRoutes } from './routes/auth.js';
import { personRoutes } from './routes/person.js';
import { userRoutes } from './routes/user.js';
import { organizationRoutes } from './routes/organization.js';
import { organizationUserRoutes } from './routes/organization-user.js';
import { organizationUserProfileRoutes } from './routes/organization-user-profile.js';
import { organizationModuleRoutes } from './routes/organization-module.js';
import { profileRoutes } from './routes/profile.js';
import { profileRuleRoutes } from './routes/profile-rule.js';
import { moduleRoutes } from './routes/module.js';
import { moduleRuleRoutes } from './routes/module-rule.js';
import { countryRoutes } from './routes/country.js';
import { countryStateRoutes } from './routes/country-state.js';
import { createDataSource } from './database/data-source.js';
import { registerSwagger } from './plugins/swagger.js';
import { registerErrorHandler } from './plugins/error-handler.js';

const app = Fastify({ logger: true });

let dataSource;
try {
  dataSource = createDataSource();
  await dataSource.initialize();
  app.log.info('Banco de dados inicializado e migrations aplicadas.');
} catch (error) {
  app.log.error(error, 'Falha ao inicializar o banco de dados (migrations).');
  process.exit(1);
}

app.decorate('dataSource', dataSource);

await app.register(cors, { origin: true });
await registerErrorHandler(app);
await registerSwagger(app);
await app.register(authRoutes, { prefix: '/api' });
await app.register(personRoutes, { prefix: '/api/person' });
await app.register(userRoutes, { prefix: '/api/user' });
await app.register(organizationRoutes, { prefix: '/api/organization' });
await app.register(organizationUserRoutes, { prefix: '/api/organization-user' });
await app.register(organizationUserProfileRoutes, { prefix: '/api/organization-user-profile' });
await app.register(organizationModuleRoutes, { prefix: '/api/organization-module' });
await app.register(profileRoutes, { prefix: '/api/profile' });
await app.register(profileRuleRoutes, { prefix: '/api/profile-rule' });
await app.register(moduleRoutes, { prefix: '/api/module' });
await app.register(moduleRuleRoutes, { prefix: '/api/module-rule' });
await app.register(countryRoutes, { prefix: '/api/country' });
await app.register(countryStateRoutes, { prefix: '/api/country-state' });

app.get('/health', { schema: { hide: false } }, async () => ({ status: 'ok' }));

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
