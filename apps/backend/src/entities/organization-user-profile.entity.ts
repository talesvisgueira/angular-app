import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { OrganizationUser } from './organization-user.entity.js';
import { Profile } from './profile.entity.js';

@Entity('organization_user_profile')
export class OrganizationUserProfile {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { name: 'organization_user_id', length: 36 })
  organizationUserId!: string;

  @ManyToOne(() => OrganizationUser, { nullable: false })
  @JoinColumn({ name: 'organization_user_id' })
  organizationUser!: OrganizationUser;

  @Column('varchar', { name: 'profile_id', length: 36 })
  profileId!: string;

  @ManyToOne(() => Profile, { nullable: false })
  @JoinColumn({ name: 'profile_id' })
  profile!: Profile;

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
