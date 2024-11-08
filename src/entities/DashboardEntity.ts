import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { GraphicEntity } from './GraphicEntity';
import { DashboardCacheEntity } from './DashboardCacheEntity';

export enum DashboardPeriod {
  '7D' = '7D',
  '15D' = '15D',
  '1M' = '1M',
  '3M' = '3M',
  '6M' = '6M',
  '1A' = '1A',
}

@Entity({ name: 'dashboard' })
export class DashboardEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'character varying', name: 'title', nullable: true, unique: true })
  title: string;

  @Column({ type: 'text', name: 'description', nullable: false })
  description: string;

  @Column({ type: 'enum', enum: DashboardPeriod, default: DashboardPeriod['3M'] })
  period: DashboardPeriod;

  @CreateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: string;

  @OneToMany(() => GraphicEntity, (graphicEntity) => graphicEntity.dashboard)
  graphics?: GraphicEntity[];

  @OneToMany(() => DashboardCacheEntity, (dashboardCacheEntity) => dashboardCacheEntity.dashboard, { cascade: true })
  @JoinColumn({ name: 'dashboard_cache_id' })
  dashboardCache?: Array<DashboardCacheEntity>;
}
