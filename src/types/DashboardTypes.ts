import { DashboardPeriod } from '../entities/DashboardEntity';

export type CreateDashboardType = {
  title: string;
  description?: string;
  period: DashboardPeriod;
};

export type UpdateDashboardType = {
  id: string;
  title?: string;
  description?: string;
  period?: DashboardPeriod;
};
