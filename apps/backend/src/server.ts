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
import { stateRoutes } from './routes/state.js';
import { cityRoutes } from './routes/city.js';
import { personAddressRoutes } from './routes/person-address.js';
import { personPhoneRoutes } from './routes/person-phone.js';
import { systemRoutes } from './routes/system.js';
import { moduleOrganizationRoutes } from './routes/module-organization.js';
import { userAuthenticationModeRoutes } from './routes/user-authentication-mode.js';
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
await app.register(stateRoutes, { prefix: '/api/state' });
await app.register(cityRoutes, { prefix: '/api/city' });
await app.register(personAddressRoutes, { prefix: '/api/person-address' });
await app.register(personPhoneRoutes, { prefix: '/api/person-phone' });
await app.register(systemRoutes, { prefix: '/api/system' });
await app.register(moduleOrganizationRoutes, { prefix: '/api/module-organization' });
await app.register(userAuthenticationModeRoutes, { prefix: '/api/user-authentication-mode' });

app.get('/health', { schema: { hide: false } }, async () => ({ status: 'ok' }));

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
