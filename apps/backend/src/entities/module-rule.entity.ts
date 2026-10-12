import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Module } from './module.entity.js';
import { Organization } from './organization.entity.js';

@Entity('module_rule')
export class ModuleRule {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { name: 'module_id', length: 36 })
  moduleId!: string;

  @ManyToOne(() => Module, { nullable: false })
  @JoinColumn({ name: 'module_id' })
  module!: Module;

  @Column('varchar', { length: 80 })
  name!: string;

  @Column('varchar', { length: 400, nullable: true })
  description!: string | null;

  @Column('varchar', { name: 'organization_id', length: 36 })
  @Index('idx_module_rule_organization_id')
  organizationId!: string;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

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
