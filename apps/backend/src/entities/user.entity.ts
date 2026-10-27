import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import bcrypt from 'bcryptjs';
import { Person } from './person.entity.js';

/** Prefixos de um hash bcrypt ($2a$, $2b$ ou $2y$ + custo). */
const BCRYPT_PREFIX = /^\$2[aby]\$\d{2}\$/;

@Entity('user')
export class User {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { name: 'person_id', length: 36 })
  personId!: string;

  @ManyToOne(() => Person, { nullable: false })
  @JoinColumn({ name: 'person_id' })
  person!: Person;

  @Column('varchar', { length: 100, unique: true })
  username!: string;

  @Column('varchar', { length: 200 })
  password!: string;

  @Column('varchar', { name: 'authentication_mode', length: 20, default: 'PASSWORD' })
  authenticationMode!: string;

  @Column('boolean', { default: true })
  active!: boolean;

  @Column('varchar', { name: 'user_created', length: 36 })
  userCreated!: string;

  @Column({ name: 'data_created', type: 'datetime' })
  dataCreated!: Date;

  @Column('varchar', { name: 'user_updated', length: 36 })
  userUpdated!: string;

  @Column({ name: 'data_updated', type: 'datetime' })
  dataUpdated!: Date;

  @BeforeInsert()
  fillAudit(): void {
    const now = new Date();
    this.dataCreated = now;
    this.dataUpdated = now;
    this.hashPassword();
  }

  @BeforeUpdate()
  touchAudit(): void {
    this.dataUpdated = new Date();
    this.hashPassword();
  }

  /**
   * Grava a senha apenas como hash bcrypt: valores em texto plano são
   * hasheados; valores que já são hash (ex.: loads/re-saves) permanecem.
   */
  private hashPassword(): void {
    if (typeof this.password === 'string' && !BCRYPT_PREFIX.test(this.password)) {
      this.password = bcrypt.hashSync(this.password, 10);
    }
  }
}
