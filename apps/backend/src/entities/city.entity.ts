import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { State } from './state.entity.js';

@Entity('city')
export class City {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { name: 'state_id', length: 36 })
  stateId!: string;

  @ManyToOne(() => State, { nullable: false })
  @JoinColumn({ name: 'state_id' })
  state!: State;

  @Column('varchar', { name: 'short_name', length: 15 })
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
