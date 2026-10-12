import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CountryState } from './country-state.entity.js';
import { Country } from './country.entity.js';
import { OrganizationModule } from './organization-module.entity.js';
import { OrganizationUserProfile } from './organization-user-profile.entity.js';
import { OrganizationUser } from './organization-user.entity.js';
import { Organization } from './organization.entity.js';
import { ModuleRule } from './module-rule.entity.js';
import { ProfileRule } from './profile-rule.entity.js';
import { Module } from './module.entity.js';
import { Person } from './person.entity.js';
import { Profile } from './profile.entity.js';
import { User } from './user.entity.js';

const ENTITIES = [
  Person,
  Country,
  CountryState,
  Organization,
  User,
  OrganizationUser,
  OrganizationModule,
  Profile,
  Module,
  ModuleRule,
  ProfileRule,
  OrganizationUserProfile,
];

describe('Entidades RBAC (metadata TypeORM)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: ENTITIES,
      synchronize: false,
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('declara as 12 tabelas dos domínios RBAC', () => {
    const tables = ENTITIES.map((e) => dataSource.getMetadata(e).tableName).sort();
    expect(tables).toEqual(
      [
        'country',
        'country_state',
        'module',
        'module_rule',
        'organization',
        'organization_module',
        'organization_user',
        'organization_user_profile',
        'person',
        'profile',
        'profile_rule',
        'user',
      ].sort(),
    );
  });

  it('toda tabela possui user_created, data_created e data_updated', () => {
    for (const entity of ENTITIES) {
      const metadata = dataSource.getMetadata(entity);
      const columns = metadata.columns.map((c) => c.databaseName);
      expect(columns, metadata.tableName).toContain('user_created');
      expect(columns, metadata.tableName).toContain('data_created');
      expect(columns, metadata.tableName).toContain('data_updated');
    }
  });

  it('toda tabela declara auditoria como datetime não nula', () => {
    for (const entity of ENTITIES) {
      const metadata = dataSource.getMetadata(entity);
      for (const name of ['data_created', 'data_updated']) {
        const column = metadata.findColumnWithDatabaseName(name);
        expect(column, `${metadata.tableName}.${name}`).toBeDefined();
        expect(column?.type, `${metadata.tableName}.${name}`).toBe('datetime');
        expect(column?.isNullable, `${metadata.tableName}.${name}`).toBe(false);
      }
    }
  });

  it('tabela dependente possui organization_id indexada', () => {
    const dependent = ENTITIES.filter((e) =>
      dataSource.getMetadata(e).findColumnWithPropertyPath('organizationId'),
    );
    for (const entity of dependent) {
      const metadata = dataSource.getMetadata(entity);
      const column = metadata.findColumnWithPropertyPath('organizationId');
      expect(column, metadata.tableName).toBeDefined();
      expect(column?.databaseName).toBe('organization_id');
      const indexes = metadata.indices.map((i) => i.columns.map((c) => c.databaseName));
      expect(
        indexes.some((cols) => cols.includes('organization_id')),
        metadata.tableName,
      ).toBe(true);
    }
  });

  it('Person declara unicidade em codigo, short_name e email', () => {
    const metadata = dataSource.getMetadata(Person);
    const uniques = new Set(metadata.uniques.flatMap((u) => u.columns.map((c) => c.databaseName)));
    expect(uniques).toContain('codigo');
    expect(uniques).toContain('short_name');
    expect(uniques).toContain('email');
  });

  it('Organization herda identidade de Person (FK sobre id, sem person_id)', () => {
    const metadata = dataSource.getMetadata(Organization);
    expect(metadata.findColumnWithPropertyPath('personId')).toBeUndefined();
    const relation = metadata.findRelationWithPropertyPath('person');
    expect(relation).toBeDefined();
    expect(relation?.relationType).toBe('one-to-one');
    const join = relation?.joinColumns?.[0];
    expect(join?.databaseName).toBe('id');
    expect(join?.referencedColumn?.databaseName).toBe('id');
    expect(relation?.inverseEntityMetadata.tableName).toBe('person');
  });

  it('User herda identidade de Person (FK sobre id, sem person_id)', () => {
    const metadata = dataSource.getMetadata(User);
    expect(metadata.findColumnWithPropertyPath('personId')).toBeUndefined();
    const relation = metadata.findRelationWithPropertyPath('person');
    expect(relation).toBeDefined();
    expect(relation?.relationType).toBe('one-to-one');
    const join = relation?.joinColumns?.[0];
    expect(join?.databaseName).toBe('id');
    expect(join?.referencedColumn?.databaseName).toBe('id');
    expect(relation?.inverseEntityMetadata.tableName).toBe('person');
  });

  it('User não possui organization_id (vínculo apenas via organization_user)', () => {
    const metadata = dataSource.getMetadata(User);
    expect(metadata.findColumnWithPropertyPath('organizationId')).toBeUndefined();
    expect(metadata.findColumnWithDatabaseName('organization_id')).toBeUndefined();
    expect(metadata.findRelationWithPropertyPath('organization')).toBeUndefined();
  });

  it('Country declara unicidade em sigla', () => {
    const metadata = dataSource.getMetadata(Country);
    const uniques = new Set(metadata.uniques.flatMap((u) => u.columns.map((c) => c.databaseName)));
    expect(uniques).toContain('sigla');
  });

  it('Organization possui countrystate_id, telefone e parent_id', () => {
    const metadata = dataSource.getMetadata(Organization);
    const countrystate = metadata.findColumnWithPropertyPath('countrystateId');
    expect(countrystate?.databaseName).toBe('countrystate_id');
    expect(countrystate?.isNullable).toBe(true);
    const telefone = metadata.findColumnWithPropertyPath('telefone');
    expect(telefone?.databaseName).toBe('telefone');
    expect(telefone?.isNullable).toBe(true);
    expect(telefone?.length).toBe('13');
    const parentId = metadata.findColumnWithPropertyPath('parentId');
    expect(parentId?.databaseName).toBe('parent_id');
    expect(parentId?.isNullable).toBe(true);
    const parent = metadata.findRelationWithPropertyPath('parent');
    expect(parent?.inverseEntityMetadata.tableName).toBe('organization');
  });

  it('pivots referenciam as entidades corretas por FK', () => {
    const expected: Array<[new () => unknown, string, string]> = [
      [ProfileRule, 'profile', 'profile'],
      [ProfileRule, 'moduleRule', 'module_rule'],
      [OrganizationUser, 'user', 'user'],
      [OrganizationUserProfile, 'organizationUser', 'organization_user'],
      [OrganizationUserProfile, 'profile', 'profile'],
      [OrganizationModule, 'organization', 'organization'],
      [OrganizationModule, 'module', 'module'],
      [CountryState, 'country', 'country'],
    ];
    for (const [entity, prop, table] of expected) {
      const metadata = dataSource.getMetadata(entity);
      const relation = metadata.findRelationWithPropertyPath(prop);
      expect(relation, `${metadata.tableName}.${prop}`).toBeDefined();
      expect(relation?.inverseEntityMetadata.tableName).toBe(table);
    }
  });
});
