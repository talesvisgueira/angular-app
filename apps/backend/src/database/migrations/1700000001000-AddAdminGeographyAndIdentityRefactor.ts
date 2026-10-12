import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Refator administrativo:
 * - Novas tabelas country, country_state e organization_module.
 * - organization: countrystate_id (FK country_state), telefone, parent_id (auto-relacionamento).
 * - BREAKING: user e organization passam a herdar identidade de person
 *   (id é FK de person.id; coluna person_id removida; cópia de dados assume id = person_id).
 *
 * Requisito de dados: banco iniciado pelo esquema inicial sem vínculos pendentes
 * (tabelas filhas de user/organization vazias), pois o SQLite não permite recriar
 * tabelas pai com filhos populados com foreign_keys ativo.
 */
export class AddAdminGeographyAndIdentityRefactor1700000001000 implements MigrationInterface {
  name = 'AddAdminGeographyAndIdentityRefactor1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "country" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "sigla" varchar(15) NOT NULL,
        "nome" varchar(80) NOT NULL,
        "user_created" varchar(36) NOT NULL,
        "data_create" varchar(32) NOT NULL,
        CONSTRAINT "uq_country_sigla" UNIQUE ("sigla")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "country_state" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "country_id" varchar(36) NOT NULL,
        "sigla" varchar(15) NOT NULL,
        "nome" varchar(80) NOT NULL,
        "user_created" varchar(36) NOT NULL,
        "data_create" varchar(32) NOT NULL,
        CONSTRAINT "fk_country_state_country_id" FOREIGN KEY ("country_id") REFERENCES "country" ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_country_state_country_id" ON "country_state" ("country_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "organization_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "endereco" varchar(100) NOT NULL,
        "bairro" varchar(80) NOT NULL,
        "countrystate_id" varchar(36) NULL,
        "telefone" varchar(13) NULL,
        "parent_id" varchar(36) NULL,
        "user_created" varchar(36) NOT NULL,
        "data_create" varchar(32) NOT NULL,
        CONSTRAINT "fk_organization_id" FOREIGN KEY ("id") REFERENCES "person" ("id"),
        CONSTRAINT "fk_organization_countrystate_id" FOREIGN KEY ("countrystate_id") REFERENCES "country_state" ("id"),
        CONSTRAINT "fk_organization_parent_id" FOREIGN KEY ("parent_id") REFERENCES "organization_temp" ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "organization_temp" ("id", "endereco", "bairro", "user_created", "data_create")
      SELECT "person_id", "endereco", "bairro", "user_created", "data_create" FROM "organization"
    `);

    await queryRunner.query(`
      CREATE TABLE "user_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "username" varchar(100) NOT NULL,
        "password" varchar(200) NOT NULL,
        "active" boolean NOT NULL DEFAULT (1),
        "organization_id" varchar(36) NOT NULL,
        "user_created" varchar(36) NOT NULL,
        "data_create" varchar(32) NOT NULL,
        CONSTRAINT "fk_user_id" FOREIGN KEY ("id") REFERENCES "person" ("id"),
        CONSTRAINT "fk_user_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization_temp" ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "user_temp" ("id", "username", "password", "active", "organization_id", "user_created", "data_create")
      SELECT "person_id", "username", "password", "active", "organization_id", "user_created", "data_create" FROM "user"
    `);

    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "organization"`);

    await queryRunner.query(
      `CREATE INDEX "idx_user_organization_id" ON "user_temp" ("organization_id")`,
    );

    await queryRunner.query(`ALTER TABLE "organization_temp" RENAME TO "organization"`);
    await queryRunner.query(`ALTER TABLE "user_temp" RENAME TO "user"`);

    await queryRunner.query(`
      CREATE TABLE "organization_module" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "organization_id" varchar(36) NOT NULL,
        "module_id" varchar(36) NOT NULL,
        "active" boolean NOT NULL DEFAULT (1),
        "user_created" varchar(36) NOT NULL,
        "data_create" varchar(32) NOT NULL,
        CONSTRAINT "fk_organization_module_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id"),
        CONSTRAINT "fk_organization_module_module_id" FOREIGN KEY ("module_id") REFERENCES "module" ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_organization_module_organization_id" ON "organization_module" ("organization_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "organization_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "person_id" varchar(36) NOT NULL,
        "endereco" varchar(100) NOT NULL,
        "bairro" varchar(80) NOT NULL,
        "user_created" varchar(36) NOT NULL,
        "data_create" varchar(32) NOT NULL,
        CONSTRAINT "uq_organization_person_id" UNIQUE ("person_id"),
        CONSTRAINT "fk_organization_person_id" FOREIGN KEY ("person_id") REFERENCES "person" ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "organization_temp" ("id", "person_id", "endereco", "bairro", "user_created", "data_create")
      SELECT "id", "id", "endereco", "bairro", "user_created", "data_create" FROM "organization"
    `);

    await queryRunner.query(`
      CREATE TABLE "user_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "person_id" varchar(36) NOT NULL,
        "username" varchar(100) NOT NULL,
        "password" varchar(200) NOT NULL,
        "active" boolean NOT NULL DEFAULT (1),
        "organization_id" varchar(36) NOT NULL,
        "user_created" varchar(36) NOT NULL,
        "data_create" varchar(32) NOT NULL,
        CONSTRAINT "fk_user_person_id" FOREIGN KEY ("person_id") REFERENCES "person" ("id"),
        CONSTRAINT "fk_user_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization_temp" ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "user_temp" ("id", "person_id", "username", "password", "active", "organization_id", "user_created", "data_create")
      SELECT "id", "id", "username", "password", "active", "organization_id", "user_created", "data_create" FROM "user"
    `);

    await queryRunner.query(`DROP TABLE "organization_module"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "organization"`);

    await queryRunner.query(
      `CREATE INDEX "idx_user_organization_id" ON "user_temp" ("organization_id")`,
    );

    await queryRunner.query(`ALTER TABLE "organization_temp" RENAME TO "organization"`);
    await queryRunner.query(`ALTER TABLE "user_temp" RENAME TO "user"`);

    await queryRunner.query(`DROP TABLE "country_state"`);
    await queryRunner.query(`DROP TABLE "country"`);
  }
}
