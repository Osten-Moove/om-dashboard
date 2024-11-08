import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GraphicEntity } from '../entities/GraphicEntity';
import { DashboardQueriesModule } from '../module/DashboardQueriesModule';
import { DashboardEntity } from '../entities/DashboardEntity';
import { VariablesService } from './VariablesService';

@Injectable()
export class GraphicService {
  private graphicRepository: Repository<GraphicEntity>;
  private dashboardRepository: Repository<DashboardEntity>;
  constructor(@Inject(VariablesService) private readonly variablesService: VariablesService) {
    this.graphicRepository = DashboardQueriesModule.connection.getRepository(GraphicEntity);
    this.dashboardRepository = DashboardQueriesModule.connection.getRepository(DashboardEntity);
  }
}
