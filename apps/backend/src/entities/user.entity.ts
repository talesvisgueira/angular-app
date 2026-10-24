import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Person } from './person.entity.js';

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
  }

  @BeforeUpdate()
  touchAudit(): void {
    this.dataUpdated = new Date();
  }
}
