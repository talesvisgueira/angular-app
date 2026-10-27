import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { City } from './city.entity.js';
import { Country } from './country.entity.js';
import { ModuleOrganization } from './module-organization.entity.js';
import { ModuleRule } from './module-rule.entity.js';
import { Module } from './module.entity.js';
import { OrganizationModule } from './organization-module.entity.js';
import { OrganizationUser } from './organization-user.entity.js';
import { OrganizationUserProfile } from './organization-user-profile.entity.js';
import { Organization } from './organization.entity.js';
import { PersonAddress } from './person-address.entity.js';
import { PersonPhone } from './person-phone.entity.js';
import { Person } from './person.entity.js';
import { ProfileRule } from './profile-rule.entity.js';
import { Profile } from './profile.entity.js';
import { State } from './state.entity.js';
import { System } from './system.entity.js';
import { UserAuthenticationMode } from './user-authentication-mode.entity.js';
import { User } from './user.entity.js';

const ENTITIES = [
  Person,
  Country,
  State,
  City,
  Organization,
  PersonAddress,
  PersonPhone,
  User,
  UserAuthenticationMode,
  OrganizationUser,
  Profile,
  System,
  Module,
  ModuleRule,
  ModuleOrganization,
  ProfileRule,
  OrganizationUserProfile,
  OrganizationModule,
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

  it('declara as 18 tabelas do modelo migrado', () => {
    const tables = ENTITIES.map((e) => dataSource.getMetadata(e).tableName).sort();
    expect(tables).toEqual(
      [
        'city',
        'country',
        'module',
        'module_organization',
        'module_rule',
        'organization',
        'organization_module',
        'organization_user',
        'organization_user_profile',
        'person',
        'person_address',
        'person_phone',
        'profile',
        'profile_rule',
        'state',
        'system',
        'user',
        'user_authentication_mode',
      ].sort(),
    );
  });

  it('toda tabela possui active, user_created, data_created, user_updated e data_updated', () => {
    for (const entity of ENTITIES) {
      const metadata = dataSource.getMetadata(entity);
      const columns = metadata.columns.map((c) => c.databaseName);
      expect(columns, metadata.tableName).toContain('active');
      expect(columns, metadata.tableName).toContain('user_created');
      expect(columns, metadata.tableName).toContain('data_created');
      expect(columns, metadata.tableName).toContain('user_updated');
      expect(columns, metadata.tableName).toContain('data_updated');
    }
  });

  it('toda tabela declara auditoria como datetime não nula e active booleano', () => {
    for (const entity of ENTITIES) {
      const metadata = dataSource.getMetadata(entity);
      for (const name of ['data_created', 'data_updated']) {
        const column = metadata.findColumnWithDatabaseName(name);
        expect(column, `${metadata.tableName}.${name}`).toBeDefined();
        expect(column?.type, `${metadata.tableName}.${name}`).toBe('datetime');
        expect(column?.isNullable, `${metadata.tableName}.${name}`).toBe(false);
      }
      const active = metadata.findColumnWithDatabaseName('active');
      expect(active, `${metadata.tableName}.active`).toBeDefined();
      expect(active?.type, `${metadata.tableName}.active`).toBe('boolean');
    }
  });

  it('organization_id existe apenas nas tabelas dependentes de organização', () => {
    const expected = new Set([
      'organization_user',
      'profile',
      'module',
      'module_organization',
      'organization_module',
    ]);
    for (const entity of ENTITIES) {
      const metadata = dataSource.getMetadata(entity);
      const hasColumn = metadata.findColumnWithDatabaseName('organization_id') !== undefined;
      expect(hasColumn, metadata.tableName).toBe(expected.has(metadata.tableName));
    }
  });

  it('Person declara unicidade em code, short_name e email', () => {
    const metadata = dataSource.getMetadata(Person);
    const uniques = new Set(metadata.uniques.flatMap((u) => u.columns.map((c) => c.databaseName)));
    expect(uniques).toContain('code');
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

  it('User referencia Person por person_id (ManyToOne) com authentication_mode padrão PASSWORD', () => {
    const metadata = dataSource.getMetadata(User);
    const column = metadata.findColumnWithPropertyPath('personId');
    expect(column?.databaseName).toBe('person_id');
    expect(column?.isNullable).toBe(false);
    const relation = metadata.findRelationWithPropertyPath('person');
    expect(relation).toBeDefined();
    expect(relation?.relationType).toBe('many-to-one');
    const join = relation?.joinColumns?.[0];
    expect(join?.databaseName).toBe('person_id');
    expect(join?.referencedColumn?.databaseName).toBe('id');
    expect(relation?.inverseEntityMetadata.tableName).toBe('person');
    const authMode = metadata.findColumnWithPropertyPath('authenticationMode');
    expect(authMode?.databaseName).toBe('authentication_mode');
    expect(authMode?.default).toBe('PASSWORD');
  });

  it('User não possui organization_id (vínculo apenas via organization_user)', () => {
    const metadata = dataSource.getMetadata(User);
    expect(metadata.findColumnWithPropertyPath('organizationId')).toBeUndefined();
    expect(metadata.findColumnWithDatabaseName('organization_id')).toBeUndefined();
    expect(metadata.findRelationWithPropertyPath('organization')).toBeUndefined();
  });

  it('Country declara unicidade em short_name', () => {
    const metadata = dataSource.getMetadata(Country);
    const uniques = new Set(metadata.uniques.flatMap((u) => u.columns.map((c) => c.databaseName)));
    expect(uniques).toContain('short_name');
  });

  it('State mapeia a tabela state com FK para country', () => {
    const metadata = dataSource.getMetadata(State);
    expect(metadata.tableName).toBe('state');
    const column = metadata.findColumnWithPropertyPath('countryId');
    expect(column?.databaseName).toBe('country_id');
    const relation = metadata.findRelationWithPropertyPath('country');
    expect(relation?.inverseEntityMetadata.tableName).toBe('country');
  });

  it('Organization possui city_id, zip_code e parent_id (sem telefone)', () => {
    const metadata = dataSource.getMetadata(Organization);
    const cityId = metadata.findColumnWithPropertyPath('cityId');
    expect(cityId?.databaseName).toBe('city_id');
    expect(cityId?.isNullable).toBe(true);
    const zipCode = metadata.findColumnWithPropertyPath('zipCode');
    expect(zipCode?.databaseName).toBe('zip_code');
    expect(zipCode?.isNullable).toBe(true);
    expect(metadata.findColumnWithPropertyPath('telefone')).toBeUndefined();
    expect(metadata.findColumnWithPropertyPath('countrystateId')).toBeUndefined();
    const parentId = metadata.findColumnWithPropertyPath('parentId');
    expect(parentId?.databaseName).toBe('parent_id');
    expect(parentId?.isNullable).toBe(true);
    const parent = metadata.findRelationWithPropertyPath('parent');
    expect(parent?.inverseEntityMetadata.tableName).toBe('organization');
  });

  it('Module referencia System por system_id e Organization por organization_id', () => {
    const metadata = dataSource.getMetadata(Module);
    const systemId = metadata.findColumnWithPropertyPath('systemId');
    expect(systemId?.databaseName).toBe('system_id');
    expect(systemId?.isNullable).toBe(false);
    expect(metadata.findRelationWithPropertyPath('system')?.inverseEntityMetadata.tableName).toBe(
      'system',
    );
    expect(
      metadata.findRelationWithPropertyPath('organization')?.inverseEntityMetadata.tableName,
    ).toBe('organization');
  });

  it('module_rule, profile_rule e organization_user_profile não possuem organization_id', () => {
    for (const entity of [ModuleRule, ProfileRule, OrganizationUserProfile]) {
      const metadata = dataSource.getMetadata(entity);
      expect(
        metadata.findColumnWithDatabaseName('organization_id'),
        metadata.tableName,
      ).toBeUndefined();
      expect(
        metadata.findRelationWithPropertyPath('organization'),
        metadata.tableName,
      ).toBeUndefined();
    }
  });

  it('PersonPhone usa colunas numeric para país, código e número', () => {
    const metadata = dataSource.getMetadata(PersonPhone);
    for (const prop of ['countryId', 'code', 'number']) {
      const column = metadata.findColumnWithPropertyPath(prop);
      expect(column, prop).toBeDefined();
      expect(column?.type, prop).toBe('numeric');
    }
    expect(metadata.findColumnWithPropertyPath('number')?.isNullable).toBe(true);
  });

  it('UserAuthenticationMode declara user_key único', () => {
    const metadata = dataSource.getMetadata(UserAuthenticationMode);
    const uniques = new Set(metadata.uniques.flatMap((u) => u.columns.map((c) => c.databaseName)));
    expect(uniques).toContain('user_key');
  });

  it('relações referenciam as entidades corretas por FK', () => {
    const expected: Array<[new () => unknown, string, string]> = [
      [State, 'country', 'country'],
      [City, 'state', 'state'],
      [Organization, 'person', 'person'],
      [Organization, 'city', 'city'],
      [User, 'person', 'person'],
      [PersonAddress, 'person', 'person'],
      [PersonAddress, 'city', 'city'],
      [PersonAddress, 'country', 'country'],
      [PersonAddress, 'state', 'state'],
      [PersonPhone, 'person', 'person'],
      [UserAuthenticationMode, 'user', 'user'],
      [ModuleOrganization, 'organization', 'organization'],
      [ModuleOrganization, 'module', 'module'],
      [ProfileRule, 'profile', 'profile'],
      [ProfileRule, 'moduleRule', 'module_rule'],
      [OrganizationUser, 'user', 'user'],
      [OrganizationUserProfile, 'organizationUser', 'organization_user'],
      [OrganizationUserProfile, 'profile', 'profile'],
      [OrganizationModule, 'organization', 'organization'],
      [OrganizationModule, 'module', 'module'],
    ];
    for (const [entity, prop, table] of expected) {
      const metadata = dataSource.getMetadata(entity);
      const relation = metadata.findRelationWithPropertyPath(prop);
      expect(relation, `${metadata.tableName}.${prop}`).toBeDefined();
      expect(relation?.inverseEntityMetadata.tableName).toBe(table);
    }
  });
});
