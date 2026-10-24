import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { City } from './city.entity.js';
import { Person } from './person.entity.js';

@Entity('organization')
export class Organization {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @OneToOne(() => Person, { nullable: false })
  @JoinColumn({ name: 'id' })
  person!: Person;

  @Column('varchar', { length: 100 })
  address!: string;

  @Column('varchar', { length: 80 })
  district!: string;

  @Column('varchar', { name: 'city_id', length: 36, nullable: true })
  cityId!: string | null;

  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city!: City | null;

  @Column('varchar', { name: 'zip_code', length: 10, nullable: true })
  zipCode!: string | null;

  @Column('varchar', { name: 'parent_id', length: 36, nullable: true })
  parentId!: string | null;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: Organization | null;

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
