import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ENTITIES, MIGRATIONS } from '../data-source.js';
import { Country } from '../../entities/country.entity.js';
import { CountryState } from '../../entities/country-state.entity.js';
import { Organization } from '../../entities/organization.entity.js';
import { OrganizationModule } from '../../entities/organization-module.entity.js';
import { Person } from '../../entities/person.entity.js';
import { User } from '../../entities/user.entity.js';

const AUDIT = { userCreated: '00000000-0000-0000-0000-000000000000' };

function person(overrides: Partial<Person> = {}): Person {
  return Object.assign(
    new Person(),
    {
      codigo: 'P001',
      name: 'Pessoa Raiz',
      shortName: 'P1',
      email: 'p1@example.com',
      ...AUDIT,
    },
    overrides,
  );
}

async function createPersonWithOrganization(
  dataSource: DataSource,
  personId: string,
  overrides: { codigo: string; shortName: string; email: string },
): Promise<Organization> {
  const personRepo = dataSource.getRepository(Person);
  const orgRepo = dataSource.getRepository(Organization);
  await personRepo.save(person({ id: personId, ...overrides, name: `Pessoa ${overrides.codigo}` }));
  return orgRepo.save(
    orgRepo.create({
      id: personId,
      endereco: 'Rua 1',
      bairro: 'Centro',
      ...AUDIT,
    }),
  );
}

describe('Esquema migrado (violações de FK ponta a ponta)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: ENTITIES,
      migrations: MIGRATIONS,
      synchronize: false,
      migrationsRun: true,
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('aplica todas as migrations e cria as 12 tabelas de entidades', () => {
    const tables = dataSource.entityMetadatas.map((m) => m.tableName).sort();
    expect(tables).toHaveLength(12);
    expect(tables).toContain('country');
    expect(tables).toContain('country_state');
    expect(tables).toContain('organization_module');
  });

  it('organization persiste com id herdado de person e aceita nulos', async () => {
    const org = await createPersonWithOrganization(
      dataSource,
      '11111111-1111-1111-1111-111111111111',
      { codigo: 'P001', shortName: 'P1', email: 'p1@example.com' },
    );
    expect(org.countrystateId).toBeNull();
    expect(org.telefone).toBeNull();
    expect(org.parentId).toBeNull();
  });

  it('organization sem person raiz correspondente falha por FK', async () => {
    const orgRepo = dataSource.getRepository(Organization);
    const org = orgRepo.create({
      id: '22222222-2222-2222-2222-222222222222',
      endereco: 'Rua 2',
      bairro: 'Centro',
      ...AUDIT,
    });
    await expect(orgRepo.save(org)).rejects.toThrow();
  });

  it('country_state sem país falha por FK', async () => {
    const repo = dataSource.getRepository(CountryState);
    const state = repo.create({
      id: '33333333-3333-3333-3333-333333333333',
      countryId: '44444444-4444-4444-4444-444444444444',
      sigla: 'SP',
      nome: 'São Paulo',
      ...AUDIT,
    });
    await expect(repo.save(state)).rejects.toThrow();
  });

  it('organization_module com módulo inexistente falha por FK', async () => {
    const link = dataSource.getRepository(OrganizationModule).create({
      id: '55555555-5555-5555-5555-555555555555',
      organizationId: '11111111-1111-1111-1111-111111111111',
      moduleId: '66666666-6666-6666-6666-666666666666',
      active: true,
      ...AUDIT,
    });
    await expect(dataSource.getRepository(OrganizationModule).save(link)).rejects.toThrow();
  });

  it('organization com parent_id inexistente falha por FK', async () => {
    await createPersonWithOrganization(dataSource, '77777777-7777-7777-7777-777777777777', {
      codigo: 'P002',
      shortName: 'P2',
      email: 'p2@example.com',
    });
    const orgRepo = dataSource.getRepository(Organization);
    const child = orgRepo.create({
      id: '77777777-7777-7777-7777-777777777777',
      endereco: 'Rua 3',
      bairro: 'Centro',
      parentId: '88888888-8888-8888-8888-888888888888',
      ...AUDIT,
    });
    await expect(orgRepo.save(child)).rejects.toThrow();
  });

  it('user sem person raiz correspondente falha por FK', async () => {
    const repo = dataSource.getRepository(User);
    const user = repo.create({
      id: '99999999-9999-9999-9999-999999999999',
      username: 'sem-pessoa',
      password: 'hash',
      active: true,
      ...AUDIT,
    });
    await expect(repo.save(user)).rejects.toThrow();
  });

  it('user persiste sem organization_id e a auditoria é preenchida', async () => {
    const personRepo = dataSource.getRepository(Person);
    await personRepo.save(
      person({
        id: 'aaaaaaaa-1111-1111-1111-111111111111',
        codigo: 'P010',
        shortName: 'P10',
        email: 'p10@example.com',
        ...AUDIT,
      }),
    );
    const repo = dataSource.getRepository(User);
    const saved = await repo.save(
      repo.create({
        id: 'aaaaaaaa-1111-1111-1111-111111111111',
        username: 'com-pessoa',
        password: 'hash',
        active: true,
        ...AUDIT,
      }),
    );
    expect(saved.dataCreated).toBeInstanceOf(Date);
    expect(saved.dataUpdated).toBeInstanceOf(Date);
    expect(saved.dataCreated.getTime()).toBe(saved.dataUpdated.getTime());
  });

  it('atualização renova data_updated e preserva data_created', async () => {
    const repo = dataSource.getRepository(Person);
    const saved = await repo.save(
      person({
        id: 'aaaaaaaa-2222-2222-2222-222222222222',
        codigo: 'P011',
        shortName: 'P11',
        email: 'p11@example.com',
        ...AUDIT,
      }),
    );
    const createdAt = saved.dataCreated.getTime();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await repo.save(Object.assign(saved, { name: 'Nome Atualizado' }));
    const reloaded = await repo.findOneByOrFail({ id: saved.id });
    expect(reloaded.name).toBe('Nome Atualizado');
    expect(reloaded.dataCreated.getTime()).toBe(createdAt);
    expect(reloaded.dataUpdated.getTime()).toBeGreaterThan(createdAt);
  });

  it('country aceita país com sigla única e recusa duplicada', async () => {
    const repo = dataSource.getRepository(Country);
    await repo.save(
      repo.create({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        sigla: 'BR',
        nome: 'Brasil',
        ...AUDIT,
      }),
    );
    const found = await repo.findOneByOrFail({ sigla: 'BR' });
    expect(found.nome).toBe('Brasil');
    await expect(
      repo.save(
        repo.create({
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          sigla: 'BR',
          nome: 'Duplicado',
          ...AUDIT,
        }),
      ),
    ).rejects.toThrow();
  });
});
