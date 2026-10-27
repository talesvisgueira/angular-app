import { MigrationInterface, QueryRunner, Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity.js';

const BCRYPT_PREFIX = /^\$2[aby]\$\d{2}\$/;

/**
 * Backfill de senhas: converte para hash bcrypt qualquer senha que ainda
 * esteja em texto plano (legado da autenticação por comparação direta).
 * Hashes bcrypt existentes são preservados.
 */
export class HashPlaintextPasswords1700000004000 implements MigrationInterface {
  name = 'HashPlaintextPasswords1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const repository: Repository<User> = queryRunner.manager.getRepository(User);
    const users = await repository.find();

    for (const user of users) {
      if (!BCRYPT_PREFIX.test(user.password)) {
        await repository.update({ id: user.id }, { password: bcrypt.hashSync(user.password, 10) });
      }
    }
  }

  public async down(): Promise<void> {
    // No-op: não é possível recuperar o texto original a partir do hash.
  }
}
