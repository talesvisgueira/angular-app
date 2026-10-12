import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

const AUDIT_COLUMNS = [
  { name: 'user_created', type: 'varchar', length: '36', isNullable: false },
  { name: 'data_create', type: 'varchar', length: '32', isNullable: false },
];

const ORGANIZATION_COLUMN = {
  name: 'organization_id',
  type: 'varchar',
  length: '36',
  isNullable: false,
};

const ORGANIZATION_INDEX = (table: string): TableIndex =>
  new TableIndex({
    name: `idx_${table}_organization_id`,
    columnNames: ['organization_id'],
  });

const ORGANIZATION_FK = (table: string): TableForeignKey =>
  new TableForeignKey({
    name: `fk_${table}_organization_id`,
    columnNames: ['organization_id'],
    referencedTableName: 'organization',
    referencedColumnNames: ['id'],
  });

export class InitRbacSchema1700000000000 implements MigrationInterface {
  name = 'InitRbacSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'person',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'codigo', type: 'varchar', length: '15', isNullable: false, isUnique: true },
          { name: 'name', type: 'varchar', length: '150', isNullable: false },
          { name: 'short_name', type: 'varchar', length: '20', isNullable: false, isUnique: true },
          { name: 'description', type: 'varchar', length: '400', isNullable: true },
          { name: 'email', type: 'varchar', length: '100', isNullable: false, isUnique: true },
          ...AUDIT_COLUMNS,
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'organization',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'person_id', type: 'varchar', length: '36', isNullable: false, isUnique: true },
          { name: 'endereco', type: 'varchar', length: '100', isNullable: false },
          { name: 'bairro', type: 'varchar', length: '80', isNullable: false },
          ...AUDIT_COLUMNS,
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_organization_person_id',
            columnNames: ['person_id'],
            referencedTableName: 'person',
            referencedColumnNames: ['id'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'user',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'person_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'username', type: 'varchar', length: '100', isNullable: false, isUnique: true },
          { name: 'password', type: 'varchar', length: '200', isNullable: false },
          { name: 'active', type: 'boolean', isNullable: false, default: true },
          ORGANIZATION_COLUMN,
          ...AUDIT_COLUMNS,
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_user_person_id',
            columnNames: ['person_id'],
            referencedTableName: 'person',
            referencedColumnNames: ['id'],
          }),
          ORGANIZATION_FK('user'),
        ],
        indices: [ORGANIZATION_INDEX('user')],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'organization_user',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          ORGANIZATION_COLUMN,
          { name: 'user_id', type: 'varchar', length: '36', isNullable: false },
          ...AUDIT_COLUMNS,
        ],
        foreignKeys: [
          ORGANIZATION_FK('organization_user'),
          new TableForeignKey({
            name: 'fk_organization_user_user_id',
            columnNames: ['user_id'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
          }),
        ],
        indices: [ORGANIZATION_INDEX('organization_user')],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'profile',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'name', type: 'varchar', length: '80', isNullable: false },
          { name: 'description', type: 'varchar', length: '400', isNullable: true },
          ORGANIZATION_COLUMN,
          ...AUDIT_COLUMNS,
        ],
        foreignKeys: [ORGANIZATION_FK('profile')],
        indices: [ORGANIZATION_INDEX('profile')],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'module',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'name', type: 'varchar', length: '80', isNullable: false },
          { name: 'description', type: 'varchar', length: '400', isNullable: true },
          ORGANIZATION_COLUMN,
          ...AUDIT_COLUMNS,
        ],
        foreignKeys: [ORGANIZATION_FK('module')],
        indices: [ORGANIZATION_INDEX('module')],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'module_rule',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'module_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'name', type: 'varchar', length: '80', isNullable: false },
          { name: 'description', type: 'varchar', length: '400', isNullable: true },
          ORGANIZATION_COLUMN,
          ...AUDIT_COLUMNS,
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_module_rule_module_id',
            columnNames: ['module_id'],
            referencedTableName: 'module',
            referencedColumnNames: ['id'],
          }),
          ORGANIZATION_FK('module_rule'),
        ],
        indices: [ORGANIZATION_INDEX('module_rule')],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'profile_rule',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'profile_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'module_rule_id', type: 'varchar', length: '36', isNullable: false },
          ORGANIZATION_COLUMN,
          ...AUDIT_COLUMNS,
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_profile_rule_profile_id',
            columnNames: ['profile_id'],
            referencedTableName: 'profile',
            referencedColumnNames: ['id'],
          }),
          new TableForeignKey({
            name: 'fk_profile_rule_module_rule_id',
            columnNames: ['module_rule_id'],
            referencedTableName: 'module_rule',
            referencedColumnNames: ['id'],
          }),
          ORGANIZATION_FK('profile_rule'),
        ],
        indices: [ORGANIZATION_INDEX('profile_rule')],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'organization_user_profile',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'organization_user_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'profile_id', type: 'varchar', length: '36', isNullable: false },
          ORGANIZATION_COLUMN,
          ...AUDIT_COLUMNS,
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'fk_organization_user_profile_organization_user_id',
            columnNames: ['organization_user_id'],
            referencedTableName: 'organization_user',
            referencedColumnNames: ['id'],
          }),
          new TableForeignKey({
            name: 'fk_organization_user_profile_profile_id',
            columnNames: ['profile_id'],
            referencedTableName: 'profile',
            referencedColumnNames: ['id'],
          }),
          ORGANIZATION_FK('organization_user_profile'),
        ],
        indices: [ORGANIZATION_INDEX('organization_user_profile')],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('organization_user_profile');
    await queryRunner.dropTable('profile_rule');
    await queryRunner.dropTable('module_rule');
    await queryRunner.dropTable('module');
    await queryRunner.dropTable('profile');
    await queryRunner.dropTable('organization_user');
    await queryRunner.dropTable('user');
    await queryRunner.dropTable('organization');
    await queryRunner.dropTable('person');
  }
}
