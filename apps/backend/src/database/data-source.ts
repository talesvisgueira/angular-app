import 'reflect-metadata';
import fs from 'node:fs';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { City } from '../entities/city.entity.js';
import { Country } from '../entities/country.entity.js';
import { ModuleOrganization } from '../entities/module-organization.entity.js';
import { ModuleRule } from '../entities/module-rule.entity.js';
import { Module } from '../entities/module.entity.js';
import { OrganizationModule } from '../entities/organization-module.entity.js';
import { OrganizationUser } from '../entities/organization-user.entity.js';
import { OrganizationUserProfile } from '../entities/organization-user-profile.entity.js';
import { Organization } from '../entities/organization.entity.js';
import { PersonAddress } from '../entities/person-address.entity.js';
import { PersonPhone } from '../entities/person-phone.entity.js';
import { Person } from '../entities/person.entity.js';
import { ProfileRule } from '../entities/profile-rule.entity.js';
import { Profile } from '../entities/profile.entity.js';
import { State } from '../entities/state.entity.js';
import { System } from '../entities/system.entity.js';
import { UserAuthenticationMode } from '../entities/user-authentication-mode.entity.js';
import { User } from '../entities/user.entity.js';
import { InitRbacSchema1700000000000 } from './migrations/1700000000000-InitRbacSchema.js';
import { AddAdminGeographyAndIdentityRefactor1700000001000 } from './migrations/1700000001000-AddAdminGeographyAndIdentityRefactor.js';
import { AddCrudApiFoundation1700000002000 } from './migrations/1700000002000-AddCrudApiFoundation copy.js';
import { AddNewDB1700000003000 } from './migrations/1700000003000-AddNewDB.js';
import { HashPlaintextPasswords1700000004000 } from './migrations/1700000004000-HashPlaintextPasswords.js';

export const ENTITIES = [
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

export const MIGRATIONS = [
  InitRbacSchema1700000000000,
  AddAdminGeographyAndIdentityRefactor1700000001000,
  AddCrudApiFoundation1700000002000,
  AddNewDB1700000003000,
  HashPlaintextPasswords1700000004000,
];

export function ensureDatabaseDirectory(database: string): void {
  const dir = path.dirname(path.resolve(database));
  if (!fs.existsSync(dir)) {
    throw new Error(`Diretório do banco de dados não existe: ${dir}`);
  }
}

export function createDataSource(database = process.env.DB_PATH ?? 'data/app.sqlite'): DataSource {
  ensureDatabaseDirectory(database);
  return new DataSource({
    type: 'better-sqlite3',
    database,
    entities: ENTITIES,
    migrations: MIGRATIONS,
    synchronize: false,
    migrationsRun: true,
  });
}
