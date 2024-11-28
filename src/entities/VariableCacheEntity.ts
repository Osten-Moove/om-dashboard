import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { VariablesEntity } from '../entities/VariablesEntity';

@Entity({ name: 'variable_cache' })
export class VariableCacheEntity {
  @PrimaryColumn({ type: 'uuid', name: 'variable_id' })
  variableId: string;

  @PrimaryColumn('params')
  params: string;

  @Column({ type: 'character varying', name: 'value' })
  value: string;

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

  @ManyToOne(() => VariablesEntity, (variables: VariablesEntity) => variables.id)
  @JoinColumn({ name: 'variable_id' })
  variable: VariablesEntity;
}
