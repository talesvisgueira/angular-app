import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLES = [
  'organization_module',
  'organization_user_profile',
  'profile_rule',
  'module_rule',
  'module',
  'profile',
  'user',
  'organization_user',
  'organization',
  'country_state',
  'country',
  'person',
] as const;

const COMMON_FIELD = `"active" boolean NOT NULL DEFAULT (1),
        "user_created" varchar(36) NOT NULL,
        "data_created" datetime NOT NULL,
        "user_updated" varchar(36) NOT NULL,
        "data_updated" datetime NOT NULL`;

export class AddNewDB1700000003000 implements MigrationInterface {
  name = 'AddNewDB1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(`DROP TABLE "${table}"`);
    }

    await queryRunner.query(`
      CREATE TABLE "person" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "code" varchar(15) NOT NULL UNIQUE,
        "name" varchar(150) NOT NULL,
        "short_name" varchar(20) NOT NULL UNIQUE,
        "description" varchar(400) NULL,
        "email" varchar(100) NOT NULL UNIQUE,
        ${COMMON_FIELD}
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "country" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "short_name" varchar(2) NOT NULL,
        "name" varchar(80) NOT NULL,
        ${COMMON_FIELD},
        CONSTRAINT "uq_country_short_name" UNIQUE ("short_name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "state" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "country_id" varchar(36) NOT NULL,
        "short_name" varchar(2) NOT NULL,
        "name" varchar(80) NOT NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_state_country_id" FOREIGN KEY ("country_id") REFERENCES "country" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "city" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "state_id" varchar(36) NOT NULL,
        "short_name" varchar(15) NOT NULL,
        "name" varchar(80) NOT NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_city_state_id" FOREIGN KEY ("state_id") REFERENCES "state" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "parent_id" varchar(36) NULL,
        "address" varchar(100) NOT NULL,
        "district" varchar(80) NOT NULL,
        "city_id" varchar(36) NULL,
        "zip_code" varchar(10) NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_organization_id" FOREIGN KEY ("id") REFERENCES "person" ("id"),
        CONSTRAINT "fk_organization_city_id" FOREIGN KEY ("city_id") REFERENCES "city" ("id"),
        CONSTRAINT "fk_organization_parent_id" FOREIGN KEY ("parent_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "person_address" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "person_id" varchar(36) NULL,
        "address" varchar(100) NOT NULL,
        "district" varchar(80) NOT NULL,
        "zip_code" varchar(10) NULL,
        "city_id" varchar(36) NULL,
        "country_id" varchar(36) NULL,
        "state_id" varchar(36) NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_person_address_city_id" FOREIGN KEY ("city_id") REFERENCES "city" ("id"),
        CONSTRAINT "fk_person_address_person_id" FOREIGN KEY ("person_id") REFERENCES "person" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "person_phone" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "person_id" varchar(36) NULL,
        "country_id" numeric(2) NOT NULL,
        "code" numeric(3) NOT NULL,
        "number" numeric(10) NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_person_phone_person_id" FOREIGN KEY ("person_id") REFERENCES "person" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "person_id" varchar(36) NOT NULL,
        "username" varchar(100) NOT NULL UNIQUE,
        "password" varchar(200) NOT NULL,
        "authentication_mode" varchar(20) NOT NULL DEFAULT ('PASSWORD'),
        ${COMMON_FIELD},
        CONSTRAINT "fk_person_id" FOREIGN KEY ("person_id") REFERENCES "person" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_authentication_mode" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "user_id" varchar(36) NOT NULL,
        "user_key" varchar(100) NOT NULL UNIQUE,
        "key_value" varchar(400) NOT NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_user_authentication_mode_id" FOREIGN KEY ("user_id") REFERENCES "user" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization_user" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "organization_id" varchar(36) NOT NULL,
        "user_id" varchar(36) NOT NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_organization_user_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id"),
        CONSTRAINT "fk_organization_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "profile" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "name" varchar(80) NOT NULL,
        "description" varchar(400) NULL,
        "organization_id" varchar(36) NOT NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_profile_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "system" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "name" varchar(80) NOT NULL,
        "description" varchar(400) NULL,
        ${COMMON_FIELD}
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "module" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "system_id" varchar(36) NOT NULL,
        "name" varchar(80) NOT NULL,
        "description" varchar(400) NULL,
        "organization_id" varchar(36) NOT NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_module_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "module_rule" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "module_id" varchar(36) NOT NULL,
        "name" varchar(80) NOT NULL,
        "description" varchar(400) NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_module_rule_module_id" FOREIGN KEY ("module_id") REFERENCES "module" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "module_organization" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "organization_id" varchar(36) NOT NULL,
        "module_id" varchar(36) NOT NULL,
        "name" varchar(80) NOT NULL,
        "description" varchar(400) NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_module_organization_module_id" FOREIGN KEY ("module_id") REFERENCES "module" ("id"),
        CONSTRAINT "fk_module_organization_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "profile_rule" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "profile_id" varchar(36) NOT NULL,
        "module_rule_id" varchar(36) NOT NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_profile_rule_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile" ("id"),
        CONSTRAINT "fk_profile_rule_module_rule_id" FOREIGN KEY ("module_rule_id") REFERENCES "module_rule" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization_user_profile" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "organization_user_id" varchar(36) NOT NULL,
        "profile_id" varchar(36) NOT NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_organization_user_profile_organization_user_id" FOREIGN KEY ("organization_user_id") REFERENCES "organization_user" ("id"),
        CONSTRAINT "fk_organization_user_profile_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization_module" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "organization_id" varchar(36) NOT NULL,
        "module_id" varchar(36) NOT NULL,
        ${COMMON_FIELD},
        CONSTRAINT "fk_organization_module_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id"),
        CONSTRAINT "fk_organization_module_module_id" FOREIGN KEY ("module_id") REFERENCES "module" ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
