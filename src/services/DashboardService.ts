import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DashboardEntity } from '../entities/DashboardEntity';
import { DashboardCacheEntity } from '../entities/DashboardCacheEntity';
import { DashboardQueriesModule } from '../module/DashboardQueriesModule';
import { GraphicService } from './GraphicService';
import { ExceptionDTO, ServiceDTO } from '@duaneoli/base-project-nest';
import { CreateDashboardType, UpdateDashboardType } from '../types/DashboardTypes';
import { createUniqueHash } from '../helpers/CreateHash';

@Injectable()
export class DashboardService {
  private dashboardRepository: Repository<DashboardEntity>;
  private dashboardCacheRepository: Repository<DashboardCacheEntity>;
  constructor(@Inject(GraphicService) private readonly graphicService: GraphicService) {
    this.dashboardRepository = DashboardQueriesModule.connection.getRepository(DashboardEntity);
    this.dashboardCacheRepository = DashboardQueriesModule.connection.getRepository(DashboardCacheEntity);
  }

  async create({ title, description = null, period }: CreateDashboardType) {
    const dashboardAlreadyExists = await this.dashboardRepository.findOne({
      where: { title },
    });

    if (dashboardAlreadyExists) throw Error('Dashboard already exists.');

    const create = await this.dashboardRepository.save({
      title,
      description,
      period,
    });

    return new ServiceDTO([create]);
  }

  async updateCache(dashboardId: string, params: Array<string>) {
    try {
      const cache = await this.graphicService.generateMultipleGraphs(dashboardId, params);

      const cacheExists = await this.dashboardCacheRepository.findOne({
        where: { dashboard: { id: dashboardId }, params: createUniqueHash(params) },
      });

      if (!cacheExists) {
        return await this.dashboardCacheRepository.save({
          dataCache: cache as any,
          dashboard: { id: dashboardId },
          params: createUniqueHash(params),
        });
      }

      await this.dashboardCacheRepository.update(cacheExists.id, {
        dataCache: cache as any,
      });
    } catch (error) {
      throw ExceptionDTO.error('failed do generate dashboard', error);
    }
  }

  async searchDashboard(id: string, params: Array<string>, refresh: boolean = false) {
    const dashboardExists = await this.dashboardRepository.findOne({
      where: { id },
    });

    if (!dashboardExists) throw Error('Dashboard not found.');

    if (!refresh) {
      const cache = await this.dashboardCacheRepository.findOne({
        where: { dashboard: { id: dashboardExists.id }, params: createUniqueHash(params) },
      });

      if (cache) {
        const dashboardCacheUpdatedDateInMilliseconds = new Date(cache.updatedAt).getTime();
        const currentDateInMilliseconds = new Date().getTime();

        const threeHourInMilliseconds = 3 * 60 * 60 * 1000;

        const timeForUpdatingDataExpired =
          currentDateInMilliseconds - dashboardCacheUpdatedDateInMilliseconds > threeHourInMilliseconds;

        if (!timeForUpdatingDataExpired) return cache;
      }
    }

    this.updateCache(id, params);

    return 'Generating dashboard';
  }

  async update({ id, ...query }: UpdateDashboardType) {
    const dashboardExists = await this.dashboardRepository.findOne({
      where: { id },
    });

    if (!dashboardExists) throw Error('Dashboard not found!');

    Object.assign(dashboardExists, { ...query });

    const updateDashboard = await this.dashboardRepository.save(dashboardExists);

    return new ServiceDTO([updateDashboard]);
  }
}
