import { Logger } from '@nestjs/common';
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum UnitMeasureEnum {
  PERCENT = 'PERCENT',
  BOOLEAN = 'BOOLEAN',
  NUMBER = 'NUMBER',
}

@Entity({ name: 'variables' })
export class VariablesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
    name: 'alias',
    unique: true,
    nullable: false,
  })
  alias: string;

  @Column({ type: 'character varying', name: 'query', nullable: false })
  query: string;

  @Column({ type: 'character varying', name: 'description', nullable: false })
  description: string;

  @Column({
    type: 'enum',
    enum: UnitMeasureEnum,
    name: 'unit_of_measure',
    default: UnitMeasureEnum.NUMBER,
  })
  unitOfMeasure: UnitMeasureEnum;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  isActive: boolean;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: string;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  updatedAt: string;

  constructor(entity?: {
    id: string;
    alias: string;
    query: string;
    description: string;
    unitOfMeasure: UnitMeasureEnum;
    isActive: boolean;
  }) {
    if (!entity) return;
    if (entity.id) this.id = entity.id;
    if (entity.alias) this.alias = entity.alias;
    if (entity.query) this.query = entity.query;
    if (entity.description) this.description = entity.description;
    if (entity.unitOfMeasure) this.unitOfMeasure = entity.unitOfMeasure;
    if (entity.isActive) this.isActive = entity.isActive;
  }

  @BeforeInsert()
  beforeInsert() {
    Logger.debug(
      `VariablesEntity::beforeInsert.id: ${this.id} alias: ${this.alias} query: ${this.query} description: ${this.description} unitOfMeasure: ${this.unitOfMeasure} isActive: ${this.isActive}`,
    );
  }
}
