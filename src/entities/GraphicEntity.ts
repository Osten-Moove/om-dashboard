import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GraphicMetrics, GraphicType } from '../enums/GraphicEnum';
import { DashboardEntity } from './DashboardEntity';

@Entity({ name: 'graphic' })
export class GraphicEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'character varying', name: 'title', nullable: true })
  title: string;

  @Column({ type: 'enum', enum: GraphicMetrics, default: GraphicMetrics.TOTAL })
  metrics: GraphicMetrics;

  @Column({ type: 'enum', enum: GraphicType, nullable: false, default: GraphicType.TABLE })
  type: GraphicType;

  @Column({ type: 'json', name: 'date_functions', nullable: true })
  dataFunctions: object;

  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: string;

  @ManyToOne(() => DashboardEntity, (dashboardEntity) => dashboardEntity.graphics)
  @JoinColumn({ name: 'dashboard_id' })
  dashboard: DashboardEntity;

  constructor() {}
}
