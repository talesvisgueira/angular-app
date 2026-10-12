import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ModuleRule } from './module-rule.entity.js';
import { Organization } from './organization.entity.js';
import { Profile } from './profile.entity.js';

@Entity('profile_rule')
export class ProfileRule {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { name: 'profile_id', length: 36 })
  profileId!: string;

  @ManyToOne(() => Profile, { nullable: false })
  @JoinColumn({ name: 'profile_id' })
  profile!: Profile;

  @Column('varchar', { name: 'module_rule_id', length: 36 })
  moduleRuleId!: string;

  @ManyToOne(() => ModuleRule, { nullable: false })
  @JoinColumn({ name: 'module_rule_id' })
  moduleRule!: ModuleRule;

  @Column('varchar', { name: 'organization_id', length: 36 })
  @Index('idx_profile_rule_organization_id')
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
