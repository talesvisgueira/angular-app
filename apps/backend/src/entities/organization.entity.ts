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
import { Person } from './person.entity.js';
import { CountryState } from './country-state.entity.js';

@Entity('organization')
export class Organization {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @OneToOne(() => Person, { nullable: false })
  @JoinColumn({ name: 'id' })
  person!: Person;

  @Column('varchar', { length: 100 })
  endereco!: string;

  @Column('varchar', { name: 'bairro', length: 80 })
  bairro!: string;

  @Column('varchar', { name: 'countrystate_id', length: 36, nullable: true })
  countrystateId!: string | null;

  @ManyToOne(() => CountryState, { nullable: true })
  @JoinColumn({ name: 'countrystate_id' })
  countryState!: CountryState | null;

  @Column('varchar', { length: 13, nullable: true })
  telefone!: string | null;

  @Column('varchar', { name: 'parent_id', length: 36, nullable: true })
  parentId!: string | null;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: Organization | null;

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
