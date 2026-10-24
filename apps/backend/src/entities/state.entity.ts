import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Country } from './country.entity.js';

@Entity('state')
export class State {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { name: 'country_id', length: 36 })
  countryId!: string;

  @ManyToOne(() => Country, { nullable: false })
  @JoinColumn({ name: 'country_id' })
  country!: Country;

  @Column('varchar', { name: 'short_name', length: 2 })
  shortName!: string;

  @Column('varchar', { length: 80 })
  name!: string;

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
