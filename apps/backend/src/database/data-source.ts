import 'reflect-metadata';
import fs from 'node:fs';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { OrganizationUserProfile } from '../entities/organization-user-profile.entity.js';
import { OrganizationUser } from '../entities/organization-user.entity.js';
import { OrganizationModule } from '../entities/organization-module.entity.js';
import { CountryState } from '../entities/country-state.entity.js';
import { Country } from '../entities/country.entity.js';
import { Organization } from '../entities/organization.entity.js';
import { ModuleRule } from '../entities/module-rule.entity.js';
import { ProfileRule } from '../entities/profile-rule.entity.js';
import { Module } from '../entities/module.entity.js';
import { Person } from '../entities/person.entity.js';
import { Profile } from '../entities/profile.entity.js';
import { User } from '../entities/user.entity.js';
import { InitRbacSchema1700000000000 } from './migrations/1700000000000-InitRbacSchema.js';
import { AddAdminGeographyAndIdentityRefactor1700000001000 } from './migrations/1700000001000-AddAdminGeographyAndIdentityRefactor.js';
import { AddCrudApiFoundation1700000002000 } from './migrations/1700000002000-AddCrudApiFoundation.js';

export const ENTITIES = [
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

export const MIGRATIONS = [
  InitRbacSchema1700000000000,
  AddAdminGeographyAndIdentityRefactor1700000001000,
  AddCrudApiFoundation1700000002000,
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
