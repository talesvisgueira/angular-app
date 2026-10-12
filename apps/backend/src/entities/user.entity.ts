import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Person } from './person.entity.js';

@Entity('user')
export class User {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @OneToOne(() => Person, { nullable: false })
  @JoinColumn({ name: 'id' })
  person!: Person;

  @Column('varchar', { length: 100, unique: true })
  username!: string;

  @Column('varchar', { length: 200 })
  password!: string;

  @Column('boolean', { default: true })
  active!: boolean;

  @Column('varchar', { name: 'user_created', length: 36 })
  userCreated!: string;

  @Column({ name: 'data_created', type: 'datetime' })
  dataCreated!: Date;

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
