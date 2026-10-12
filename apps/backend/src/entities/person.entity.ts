import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('person')
export class Person {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { name: 'codigo', length: 15, unique: true })
  codigo!: string;

  @Column('varchar', { length: 150 })
  name!: string;

  @Column('varchar', { name: 'short_name', length: 20, unique: true })
  shortName!: string;

  @Column('varchar', { length: 400, nullable: true })
  description!: string | null;

  @Column('varchar', { length: 100, unique: true })
  email!: string;

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
