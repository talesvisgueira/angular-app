import type { FastifyInstance } from 'fastify';
import type { HasUsersResponse, LoginResponse, SetupRequest } from '@monorepo/shared';
import { isLoginRequest, isSetupRequest } from '@monorepo/shared';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { Person } from '../entities/person.entity.js';
import { Organization } from '../entities/organization.entity.js';
import { OrganizationUser } from '../entities/organization-user.entity.js';
import { OrganizationUserProfile } from '../entities/organization-user-profile.entity.js';
import { Profile } from '../entities/profile.entity.js';
import { signSessionToken, verifySessionToken } from '../config/jwt.js';

/** Nome do perfil atribuído ao primeiro administrador. */
const ADMIN_PROFILE_NAME = 'Administrador';

/** Valor padrão para campos NOT NULL não coletados pelo cadastro mínimo. */
const UNINFORMED_FIELD = 'NÃO INFORMADO';

/** Auditoria do provisionamento inicial: ainda não há usuário criador. */
const SYSTEM_AUDIT = { userCreated: 'system', userUpdated: 'system' } as const;

/** Prefixo alfanumérico do nome, sem acentos, para gerar code/shortName. */
function nameSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** `code` varchar(15) gerado a partir do nome + sufixo aleatório de UUID. */
function generatedCode(name: string): string {
  return `${nameSlug(name).slice(0, 10)}${randomUUID().replace(/-/g, '').slice(0, 4)}`;
}

/** `shortName` varchar(20) gerado a partir do nome + sufixo aleatório de UUID. */
function generatedShortName(name: string): string {
  return `${nameSlug(name).slice(0, 17)}${randomUUID().replace(/-/g, '').slice(0, 3)}`;
}

/** Recusa explícita do cadastro inicial (409 com mensagem). */
function conflict(message: string): Error {
  return Object.assign(new Error(message), { statusCode: 409 });
}

/** Identidade do administrador criado, para emitir a sessão. */
interface SetupResult {
  userId: string;
  email: string;
  name: string;
}

/** Nomes (distintos) dos perfis ativos do usuário via vínculos ativos. */
async function activeProfileNames(dataSource: DataSource, userId: string): Promise<string[]> {
  const links = await dataSource.getRepository(OrganizationUserProfile).find({
    where: {
      active: true,
      organizationUser: { userId, active: true },
      profile: { active: true },
    },
    relations: { profile: true },
  });

  return [...new Set(links.map((link) => link.profile.name))];
}

const hasUsersResponseSchema = {
  type: 'object',
  properties: { hasUsers: { type: 'boolean' } },
  required: ['hasUsers'],
  additionalProperties: false,
} as const;

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/auth/has-users',
    {
      schema: {
        tags: ['auth'],
        response: { 200: hasUsersResponseSchema },
      },
    },
    async (): Promise<HasUsersResponse> => {
      // Qualquer registro em `user` (ativo ou não) indica sistema já provisionado.
      const hasUsers = (await app.dataSource.getRepository(User).count()) > 0;
      return { hasUsers };
    },
  );

  const setupBodySchema = {
    type: 'object',
    properties: {
      organization: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 150 },
          email: { type: 'string', maxLength: 100 },
        },
        required: ['name', 'email'],
        additionalProperties: false,
      },
      admin: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 150 },
          email: { type: 'string', maxLength: 100 },
          username: { type: 'string', maxLength: 100 },
          password: { type: 'string', minLength: 6, maxLength: 200 },
        },
        required: ['name', 'email', 'username', 'password'],
        additionalProperties: false,
      },
    },
    required: ['organization', 'admin'],
    additionalProperties: false,
  } as const;

  const setupResponseSchema = {
    type: 'object',
    properties: {
      token: { type: 'string' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          profiles: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'name', 'email', 'profiles'],
        additionalProperties: false,
      },
    },
    required: ['token', 'user'],
    additionalProperties: false,
  } as const;

  const errorResponseSchema = {
    type: 'object',
    properties: { message: { type: 'string' } },
    required: ['message'],
    additionalProperties: false,
  } as const;

  app.post(
    '/auth/setup',
    {
      schema: {
        tags: ['auth'],
        body: setupBodySchema,
        response: { 201: setupResponseSchema, 400: errorResponseSchema, 409: errorResponseSchema },
      },
    },
    async (request, reply) => {
      if (!isSetupRequest(request.body)) {
        return reply.status(400).send({ message: 'Dados de cadastro inválidos.' });
      }

      const { organization, admin } = request.body;

      // Criação atômica: qualquer falha reverte todos os registros.
      const created = await app.dataSource.transaction(async (manager): Promise<SetupResult> => {
        const personRepo = manager.getRepository(Person);
        const userRepo = manager.getRepository(User);

        if (await userRepo.findOne({ where: { username: admin.username }, select: { id: true } })) {
          throw conflict('Username já utilizado.');
        }

        if (
          await personRepo.findOne({
            where: [{ email: organization.email }, { email: admin.email }],
            select: { id: true },
          })
        ) {
          throw conflict('Email já utilizado.');
        }

        // Bootstrap aberto somente enquanto não houver nenhum usuário.
        if ((await userRepo.count()) > 0) {
          throw conflict('O sistema já possui usuário cadastrado.');
        }

        const orgPerson = await personRepo.save(
          personRepo.create({
            id: randomUUID(),
            code: generatedCode(organization.name),
            name: organization.name,
            shortName: generatedShortName(organization.name),
            email: organization.email,
            ...SYSTEM_AUDIT,
          }),
        );
        await manager.getRepository(Organization).save(
          manager.getRepository(Organization).create({
            id: orgPerson.id,
            address: UNINFORMED_FIELD,
            district: UNINFORMED_FIELD,
            ...SYSTEM_AUDIT,
          }),
        );

        const adminPerson = await personRepo.save(
          personRepo.create({
            id: randomUUID(),
            code: generatedCode(admin.name),
            name: admin.name,
            shortName: generatedShortName(admin.name),
            email: admin.email,
            ...SYSTEM_AUDIT,
          }),
        );
        // A senha é hasheada pelos hooks da entidade antes de persistir.
        const user = await userRepo.save(
          userRepo.create({
            id: randomUUID(),
            personId: adminPerson.id,
            username: admin.username,
            password: admin.password,
            ...SYSTEM_AUDIT,
          }),
        );

        const organizationUser = await manager.getRepository(OrganizationUser).save(
          manager.getRepository(OrganizationUser).create({
            id: randomUUID(),
            organizationId: orgPerson.id,
            userId: user.id,
            ...SYSTEM_AUDIT,
          }),
        );
        const profile = await manager.getRepository(Profile).save(
          manager.getRepository(Profile).create({
            id: randomUUID(),
            name: ADMIN_PROFILE_NAME,
            organizationId: orgPerson.id,
            ...SYSTEM_AUDIT,
          }),
        );
        await manager.getRepository(OrganizationUserProfile).save(
          manager.getRepository(OrganizationUserProfile).create({
            id: randomUUID(),
            organizationUserId: organizationUser.id,
            profileId: profile.id,
            ...SYSTEM_AUDIT,
          }),
        );

        return { userId: user.id, email: admin.email, name: admin.name };
      });

      // Mesmo mecanismo de sessão do login, já com o perfil Administrador.
      const response: LoginResponse = {
        token: await signSessionToken({
          sub: created.userId,
          email: created.email,
          name: created.name,
          profiles: [ADMIN_PROFILE_NAME],
        }),
        user: {
          id: created.userId,
          name: created.name,
          email: created.email,
          profiles: [ADMIN_PROFILE_NAME],
        },
      };

      return reply.status(201).send(response);
    },
  );

  app.post('/auth/login', async (request, reply) => {
    if (!isLoginRequest(request.body)) {
      return reply.status(400).send({ message: 'Dados de login inválidos.' });
    }

    const { email, password } = request.body;

    const userRepo = app.dataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { person: { email }, active: true },
      relations: { person: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.status(401).send({ message: 'Credenciais inválidas.' });
    }

    const profiles = await activeProfileNames(app.dataSource, user.id);

    const response: LoginResponse = {
      token: await signSessionToken({
        sub: user.id,
        email: user.person.email,
        name: user.person.name,
        profiles,
      }),
      user: {
        id: user.id,
        name: user.person.name,
        email: user.person.email,
        profiles,
      },
    };

    return response;
  });

  app.post('/auth/validate', async (request, reply) => {
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

    if (!token) {
      return reply.status(401).send({ message: 'Token não informado.' });
    }

    const claims = await verifySessionToken(token);
    if (!claims) {
      return reply.status(401).send({ message: 'Token inválido ou expirado.' });
    }

    return claims;
  });
}
