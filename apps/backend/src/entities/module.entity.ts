import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Organization } from './organization.entity.js';
import { System } from './system.entity.js';

@Entity('module')
export class Module {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { name: 'system_id', length: 36 })
  systemId!: string;

  @ManyToOne(() => System, { nullable: false })
  @JoinColumn({ name: 'system_id' })
  system!: System;

  @Column('varchar', { length: 80 })
  name!: string;

  @Column('varchar', { length: 400, nullable: true })
  description!: string | null;

  @Column('varchar', { name: 'organization_id', length: 36 })
  organizationId!: string;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

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
