import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { DashboardEntity } from './DashboardEntity';

@Entity({ name: 'dashboard_cache' })
export class DashboardCacheEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'character varying', name: 'params' })
  params: string;

  @Column({ type: 'json', name: 'data_cache' })
  dataCache: JSON;

  @UpdateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: string;

  @ManyToOne(() => DashboardEntity, (dashboard) => dashboard.dashboardCache)
  @JoinColumn({ name: 'dashboard_id' })
  dashboard: DashboardEntity;
}
