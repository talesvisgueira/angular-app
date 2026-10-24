import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Person } from './person.entity.js';

@Entity('person_phone')
export class PersonPhone {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { name: 'person_id', length: 36, nullable: true })
  personId!: string | null;

  @ManyToOne(() => Person, { nullable: true })
  @JoinColumn({ name: 'person_id' })
  person!: Person | null;

  @Column('numeric', { name: 'country_id', precision: 2, scale: 0 })
  countryId!: number;

  @Column('numeric', { precision: 3, scale: 0 })
  code!: number;

  @Column('numeric', { precision: 10, scale: 0, nullable: true })
  number!: number | null;

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
