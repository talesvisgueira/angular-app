import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fundação da API de administração (CRUD + Swagger):
 * - Fase 1 (auditoria): todas as 12 tabelas trocam `data_create` varchar(32) por
 *   `data_created` datetime NOT NULL + `data_updated` datetime NOT NULL
 *   (dados preservados: ambas recebem o valor original de `data_create`).
 * - Fase 2 (BREAKING): `user` perde `organization_id`, `idx_user_organization_id`
 *   e `fk_user_organization_id`; o vínculo com organização passa a ser
 *   exclusivamente via `organization_user`.
 *
 * Padrão SQLite: recriação via tabelas *_temp com `PRAGMA defer_foreign_keys = ON`
 * (as verificações de FK ficam para o COMMIT; a checagem final encontra o esquema
 * consistente, com as tabelas já renomeadas). `down` é simétrico e restaura
 * `data_create` (texto ISO) e, em `user`, o vínculo a partir do primeiro
 * `organization_user` (recuo, não reconciliação).
 */

const TABLES = [
  'person',
  'country',
  'country_state',
  'organization',
  'user',
  'organization_user',
  'profile',
  'module',
  'module_rule',
  'profile_rule',
  'organization_user_profile',
  'organization_module',
] as const;

const DROP_ORDER = [
  'organization_user_profile',
  'organization_module',
  'profile_rule',
  'module_rule',
  'organization_user',
  'profile',
  'module',
  'user',
  'country_state',
  'organization',
  'country',
  'person',
] as const;

const AUDIT_NEW = `"user_created" varchar(36) NOT NULL,
        "data_created" datetime NOT NULL,
        "data_updated" datetime NOT NULL`;

const AUDIT_OLD = `"user_created" varchar(36) NOT NULL,
        "data_create" varchar(32) NOT NULL`;

export class AddCrudApiFoundation1700000002000 implements MigrationInterface {
  name = 'AddCrudApiFoundation1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`PRAGMA defer_foreign_keys = ON`);

    // Fase 1 + 2: cria as tabelas finais (auditoria datetime; user sem organization_id).
    await queryRunner.query(`
      CREATE TABLE "person_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "codigo" varchar(15) NOT NULL UNIQUE,
        "name" varchar(150) NOT NULL,
        "short_name" varchar(20) NOT NULL UNIQUE,
        "description" varchar(400) NULL,
        "email" varchar(100) NOT NULL UNIQUE,
        ${AUDIT_NEW}
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "country_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "sigla" varchar(15) NOT NULL,
        "nome" varchar(80) NOT NULL,
        ${AUDIT_NEW},
        CONSTRAINT "uq_country_sigla" UNIQUE ("sigla")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "country_state_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "country_id" varchar(36) NOT NULL,
        "sigla" varchar(15) NOT NULL,
        "nome" varchar(80) NOT NULL,
        ${AUDIT_NEW},
        CONSTRAINT "fk_country_state_country_id" FOREIGN KEY ("country_id") REFERENCES "country" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "endereco" varchar(100) NOT NULL,
        "bairro" varchar(80) NOT NULL,
        "countrystate_id" varchar(36) NULL,
        "telefone" varchar(13) NULL,
        "parent_id" varchar(36) NULL,
        ${AUDIT_NEW},
        CONSTRAINT "fk_organization_id" FOREIGN KEY ("id") REFERENCES "person" ("id"),
        CONSTRAINT "fk_organization_countrystate_id" FOREIGN KEY ("countrystate_id") REFERENCES "country_state" ("id"),
        CONSTRAINT "fk_organization_parent_id" FOREIGN KEY ("parent_id") REFERENCES "organization_temp" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "username" varchar(100) NOT NULL UNIQUE,
        "password" varchar(200) NOT NULL,
        "active" boolean NOT NULL DEFAULT (1),
        ${AUDIT_NEW},
        CONSTRAINT "fk_user_id" FOREIGN KEY ("id") REFERENCES "person" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization_user_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "organization_id" varchar(36) NOT NULL,
        "user_id" varchar(36) NOT NULL,
        ${AUDIT_NEW},
        CONSTRAINT "fk_organization_user_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id"),
        CONSTRAINT "fk_organization_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "profile_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "name" varchar(80) NOT NULL,
        "description" varchar(400) NULL,
        "organization_id" varchar(36) NOT NULL,
        ${AUDIT_NEW},
        CONSTRAINT "fk_profile_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "module_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "name" varchar(80) NOT NULL,
        "description" varchar(400) NULL,
        "organization_id" varchar(36) NOT NULL,
        ${AUDIT_NEW},
        CONSTRAINT "fk_module_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "module_rule_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "module_id" varchar(36) NOT NULL,
        "name" varchar(80) NOT NULL,
        "description" varchar(400) NULL,
        "organization_id" varchar(36) NOT NULL,
        ${AUDIT_NEW},
        CONSTRAINT "fk_module_rule_module_id" FOREIGN KEY ("module_id") REFERENCES "module" ("id"),
        CONSTRAINT "fk_module_rule_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "profile_rule_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "profile_id" varchar(36) NOT NULL,
        "module_rule_id" varchar(36) NOT NULL,
        "organization_id" varchar(36) NOT NULL,
        ${AUDIT_NEW},
        CONSTRAINT "fk_profile_rule_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile" ("id"),
        CONSTRAINT "fk_profile_rule_module_rule_id" FOREIGN KEY ("module_rule_id") REFERENCES "module_rule" ("id"),
        CONSTRAINT "fk_profile_rule_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization_user_profile_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "organization_user_id" varchar(36) NOT NULL,
        "profile_id" varchar(36) NOT NULL,
        "organization_id" varchar(36) NOT NULL,
        ${AUDIT_NEW},
        CONSTRAINT "fk_organization_user_profile_organization_user_id" FOREIGN KEY ("organization_user_id") REFERENCES "organization_user" ("id"),
        CONSTRAINT "fk_organization_user_profile_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile" ("id"),
        CONSTRAINT "fk_organization_user_profile_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization_module_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "organization_id" varchar(36) NOT NULL,
        "module_id" varchar(36) NOT NULL,
        "active" boolean NOT NULL DEFAULT (1),
        ${AUDIT_NEW},
        CONSTRAINT "fk_organization_module_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id"),
        CONSTRAINT "fk_organization_module_module_id" FOREIGN KEY ("module_id") REFERENCES "module" ("id")
      )
    `);

    // Cópia de dados: data_created e data_updated herdam o valor de data_create.
    await queryRunner.query(`
      INSERT INTO "person_temp" ("id", "codigo", "name", "short_name", "description", "email", "user_created", "data_created", "data_updated")
      SELECT "id", "codigo", "name", "short_name", "description", "email", "user_created", "data_create", "data_create" FROM "person"
    `);

    await queryRunner.query(`
      INSERT INTO "country_temp" ("id", "sigla", "nome", "user_created", "data_created", "data_updated")
      SELECT "id", "sigla", "nome", "user_created", "data_create", "data_create" FROM "country"
    `);

    await queryRunner.query(`
      INSERT INTO "country_state_temp" ("id", "country_id", "sigla", "nome", "user_created", "data_created", "data_updated")
      SELECT "id", "country_id", "sigla", "nome", "user_created", "data_create", "data_create" FROM "country_state"
    `);

    await queryRunner.query(`
      INSERT INTO "organization_temp" ("id", "endereco", "bairro", "countrystate_id", "telefone", "parent_id", "user_created", "data_created", "data_updated")
      SELECT "id", "endereco", "bairro", "countrystate_id", "telefone", "parent_id", "user_created", "data_create", "data_create" FROM "organization"
    `);

    await queryRunner.query(`
      INSERT INTO "user_temp" ("id", "username", "password", "active", "user_created", "data_created", "data_updated")
      SELECT "id", "username", "password", "active", "user_created", "data_create", "data_create" FROM "user"
    `);

    await queryRunner.query(`
      INSERT INTO "organization_user_temp" ("id", "organization_id", "user_id", "user_created", "data_created", "data_updated")
      SELECT "id", "organization_id", "user_id", "user_created", "data_create", "data_create" FROM "organization_user"
    `);

    await queryRunner.query(`
      INSERT INTO "profile_temp" ("id", "name", "description", "organization_id", "user_created", "data_created", "data_updated")
      SELECT "id", "name", "description", "organization_id", "user_created", "data_create", "data_create" FROM "profile"
    `);

    await queryRunner.query(`
      INSERT INTO "module_temp" ("id", "name", "description", "organization_id", "user_created", "data_created", "data_updated")
      SELECT "id", "name", "description", "organization_id", "user_created", "data_create", "data_create" FROM "module"
    `);

    await queryRunner.query(`
      INSERT INTO "module_rule_temp" ("id", "module_id", "name", "description", "organization_id", "user_created", "data_created", "data_updated")
      SELECT "id", "module_id", "name", "description", "organization_id", "user_created", "data_create", "data_create" FROM "module_rule"
    `);

    await queryRunner.query(`
      INSERT INTO "profile_rule_temp" ("id", "profile_id", "module_rule_id", "organization_id", "user_created", "data_created", "data_updated")
      SELECT "id", "profile_id", "module_rule_id", "organization_id", "user_created", "data_create", "data_create" FROM "profile_rule"
    `);

    await queryRunner.query(`
      INSERT INTO "organization_user_profile_temp" ("id", "organization_user_id", "profile_id", "organization_id", "user_created", "data_created", "data_updated")
      SELECT "id", "organization_user_id", "profile_id", "organization_id", "user_created", "data_create", "data_create" FROM "organization_user_profile"
    `);

    await queryRunner.query(`
      INSERT INTO "organization_module_temp" ("id", "organization_id", "module_id", "active", "user_created", "data_created", "data_updated")
      SELECT "id", "organization_id", "module_id", "active", "user_created", "data_create", "data_create" FROM "organization_module"
    `);

    for (const table of DROP_ORDER) {
      await queryRunner.query(`DROP TABLE "${table}"`);
    }

    // Índices recriados sobre as tabelas temporárias (o nome sobrevive ao rename).
    await queryRunner.query(
      `CREATE INDEX "idx_country_state_country_id" ON "country_state_temp" ("country_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_organization_user_organization_id" ON "organization_user_temp" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_profile_organization_id" ON "profile_temp" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_module_organization_id" ON "module_temp" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_module_rule_organization_id" ON "module_rule_temp" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_profile_rule_organization_id" ON "profile_rule_temp" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_organization_user_profile_organization_id" ON "organization_user_profile_temp" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_organization_module_organization_id" ON "organization_module_temp" ("organization_id")`,
    );

    for (const table of TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}_temp" RENAME TO "${table}"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`PRAGMA defer_foreign_keys = ON`);

    await queryRunner.query(`
      CREATE TABLE "person_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "codigo" varchar(15) NOT NULL UNIQUE,
        "name" varchar(150) NOT NULL,
        "short_name" varchar(20) NOT NULL UNIQUE,
        "description" varchar(400) NULL,
        "email" varchar(100) NOT NULL UNIQUE,
        ${AUDIT_OLD}
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "country_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "sigla" varchar(15) NOT NULL,
        "nome" varchar(80) NOT NULL,
        ${AUDIT_OLD},
        CONSTRAINT "uq_country_sigla" UNIQUE ("sigla")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "country_state_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "country_id" varchar(36) NOT NULL,
        "sigla" varchar(15) NOT NULL,
        "nome" varchar(80) NOT NULL,
        ${AUDIT_OLD},
        CONSTRAINT "fk_country_state_country_id" FOREIGN KEY ("country_id") REFERENCES "country" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "endereco" varchar(100) NOT NULL,
        "bairro" varchar(80) NOT NULL,
        "countrystate_id" varchar(36) NULL,
        "telefone" varchar(13) NULL,
        "parent_id" varchar(36) NULL,
        ${AUDIT_OLD},
        CONSTRAINT "fk_organization_id" FOREIGN KEY ("id") REFERENCES "person" ("id"),
        CONSTRAINT "fk_organization_countrystate_id" FOREIGN KEY ("countrystate_id") REFERENCES "country_state" ("id"),
        CONSTRAINT "fk_organization_parent_id" FOREIGN KEY ("parent_id") REFERENCES "organization_temp" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "username" varchar(100) NOT NULL UNIQUE,
        "password" varchar(200) NOT NULL,
        "active" boolean NOT NULL DEFAULT (1),
        "organization_id" varchar(36) NOT NULL,
        ${AUDIT_OLD},
        CONSTRAINT "fk_user_id" FOREIGN KEY ("id") REFERENCES "person" ("id"),
        CONSTRAINT "fk_user_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization_temp" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization_user_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "organization_id" varchar(36) NOT NULL,
        "user_id" varchar(36) NOT NULL,
        ${AUDIT_OLD},
        CONSTRAINT "fk_organization_user_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id"),
        CONSTRAINT "fk_organization_user_user_id" FOREIGN KEY ("user_id") REFERENCES "user" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "profile_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "name" varchar(80) NOT NULL,
        "description" varchar(400) NULL,
        "organization_id" varchar(36) NOT NULL,
        ${AUDIT_OLD},
        CONSTRAINT "fk_profile_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "module_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "name" varchar(80) NOT NULL,
        "description" varchar(400) NULL,
        "organization_id" varchar(36) NOT NULL,
        ${AUDIT_OLD},
        CONSTRAINT "fk_module_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "module_rule_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "module_id" varchar(36) NOT NULL,
        "name" varchar(80) NOT NULL,
        "description" varchar(400) NULL,
        "organization_id" varchar(36) NOT NULL,
        ${AUDIT_OLD},
        CONSTRAINT "fk_module_rule_module_id" FOREIGN KEY ("module_id") REFERENCES "module" ("id"),
        CONSTRAINT "fk_module_rule_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "profile_rule_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "profile_id" varchar(36) NOT NULL,
        "module_rule_id" varchar(36) NOT NULL,
        "organization_id" varchar(36) NOT NULL,
        ${AUDIT_OLD},
        CONSTRAINT "fk_profile_rule_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile" ("id"),
        CONSTRAINT "fk_profile_rule_module_rule_id" FOREIGN KEY ("module_rule_id") REFERENCES "module_rule" ("id"),
        CONSTRAINT "fk_profile_rule_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization_user_profile_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "organization_user_id" varchar(36) NOT NULL,
        "profile_id" varchar(36) NOT NULL,
        "organization_id" varchar(36) NOT NULL,
        ${AUDIT_OLD},
        CONSTRAINT "fk_organization_user_profile_organization_user_id" FOREIGN KEY ("organization_user_id") REFERENCES "organization_user" ("id"),
        CONSTRAINT "fk_organization_user_profile_profile_id" FOREIGN KEY ("profile_id") REFERENCES "profile" ("id"),
        CONSTRAINT "fk_organization_user_profile_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization_module_temp" (
        "id" varchar(36) PRIMARY KEY NOT NULL,
        "organization_id" varchar(36) NOT NULL,
        "module_id" varchar(36) NOT NULL,
        "active" boolean NOT NULL DEFAULT (1),
        ${AUDIT_OLD},
        CONSTRAINT "fk_organization_module_organization_id" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id"),
        CONSTRAINT "fk_organization_module_module_id" FOREIGN KEY ("module_id") REFERENCES "module" ("id")
      )
    `);

    // Cópia de volta: data_create recebe o timestamp como texto ISO;
    // user recupera organization_id do primeiro organization_user (recuo).
    await queryRunner.query(`
      INSERT INTO "person_temp" ("id", "codigo", "name", "short_name", "description", "email", "user_created", "data_create")
      SELECT "id", "codigo", "name", "short_name", "description", "email", "user_created", CAST("data_created" AS TEXT) FROM "person"
    `);

    await queryRunner.query(`
      INSERT INTO "country_temp" ("id", "sigla", "nome", "user_created", "data_create")
      SELECT "id", "sigla", "nome", "user_created", CAST("data_created" AS TEXT) FROM "country"
    `);

    await queryRunner.query(`
      INSERT INTO "country_state_temp" ("id", "country_id", "sigla", "nome", "user_created", "data_create")
      SELECT "id", "country_id", "sigla", "nome", "user_created", CAST("data_created" AS TEXT) FROM "country_state"
    `);

    await queryRunner.query(`
      INSERT INTO "organization_temp" ("id", "endereco", "bairro", "countrystate_id", "telefone", "parent_id", "user_created", "data_create")
      SELECT "id", "endereco", "bairro", "countrystate_id", "telefone", "parent_id", "user_created", CAST("data_created" AS TEXT) FROM "organization"
    `);

    await queryRunner.query(`
      INSERT INTO "user_temp" ("id", "username", "password", "active", "organization_id", "user_created", "data_create")
      SELECT "u"."id", "u"."username", "u"."password", "u"."active",
             (SELECT "ou"."organization_id" FROM "organization_user" "ou" WHERE "ou"."user_id" = "u"."id" LIMIT 1),
             "u"."user_created", CAST("u"."data_created" AS TEXT)
      FROM "user" "u"
    `);

    await queryRunner.query(`
      INSERT INTO "organization_user_temp" ("id", "organization_id", "user_id", "user_created", "data_create")
      SELECT "id", "organization_id", "user_id", "user_created", CAST("data_created" AS TEXT) FROM "organization_user"
    `);

    await queryRunner.query(`
      INSERT INTO "profile_temp" ("id", "name", "description", "organization_id", "user_created", "data_create")
      SELECT "id", "name", "description", "organization_id", "user_created", CAST("data_created" AS TEXT) FROM "profile"
    `);

    await queryRunner.query(`
      INSERT INTO "module_temp" ("id", "name", "description", "organization_id", "user_created", "data_create")
      SELECT "id", "name", "description", "organization_id", "user_created", CAST("data_created" AS TEXT) FROM "module"
    `);

    await queryRunner.query(`
      INSERT INTO "module_rule_temp" ("id", "module_id", "name", "description", "organization_id", "user_created", "data_create")
      SELECT "id", "module_id", "name", "description", "organization_id", "user_created", CAST("data_created" AS TEXT) FROM "module_rule"
    `);

    await queryRunner.query(`
      INSERT INTO "profile_rule_temp" ("id", "profile_id", "module_rule_id", "organization_id", "user_created", "data_create")
      SELECT "id", "profile_id", "module_rule_id", "organization_id", "user_created", CAST("data_created" AS TEXT) FROM "profile_rule"
    `);

    await queryRunner.query(`
      INSERT INTO "organization_user_profile_temp" ("id", "organization_user_id", "profile_id", "organization_id", "user_created", "data_create")
      SELECT "id", "organization_user_id", "profile_id", "organization_id", "user_created", CAST("data_created" AS TEXT) FROM "organization_user_profile"
    `);

    await queryRunner.query(`
      INSERT INTO "organization_module_temp" ("id", "organization_id", "module_id", "active", "user_created", "data_create")
      SELECT "id", "organization_id", "module_id", "active", "user_created", CAST("data_created" AS TEXT) FROM "organization_module"
    `);

    for (const table of DROP_ORDER) {
      await queryRunner.query(`DROP TABLE "${table}"`);
    }

    await queryRunner.query(
      `CREATE INDEX "idx_country_state_country_id" ON "country_state_temp" ("country_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_organization_id" ON "user_temp" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_organization_user_organization_id" ON "organization_user_temp" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_profile_organization_id" ON "profile_temp" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_module_organization_id" ON "module_temp" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_module_rule_organization_id" ON "module_rule_temp" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_profile_rule_organization_id" ON "profile_rule_temp" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_organization_user_profile_organization_id" ON "organization_user_profile_temp" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_organization_module_organization_id" ON "organization_module_temp" ("organization_id")`,
    );

    for (const table of TABLES) {
      await queryRunner.query(`ALTER TABLE "${table}_temp" RENAME TO "${table}"`);
    }
  }
}
