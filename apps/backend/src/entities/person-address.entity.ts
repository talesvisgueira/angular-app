import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { City } from './city.entity.js';
import { Country } from './country.entity.js';
import { Person } from './person.entity.js';
import { State } from './state.entity.js';

@Entity('person_address')
export class PersonAddress {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { name: 'person_id', length: 36, nullable: true })
  personId!: string | null;

  @ManyToOne(() => Person, { nullable: true })
  @JoinColumn({ name: 'person_id' })
  person!: Person | null;

  @Column('varchar', { length: 100 })
  address!: string;

  @Column('varchar', { length: 80 })
  district!: string;

  @Column('varchar', { name: 'zip_code', length: 10, nullable: true })
  zipCode!: string | null;

  @Column('varchar', { name: 'city_id', length: 36, nullable: true })
  cityId!: string | null;

  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city!: City | null;

  @Column('varchar', { name: 'country_id', length: 36, nullable: true })
  countryId!: string | null;

  @ManyToOne(() => Country, { nullable: true })
  @JoinColumn({ name: 'country_id' })
  country!: Country | null;

  @Column('varchar', { name: 'state_id', length: 36, nullable: true })
  stateId!: string | null;

  @ManyToOne(() => State, { nullable: true })
  @JoinColumn({ name: 'state_id' })
  state!: State | null;

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
