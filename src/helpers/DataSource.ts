import { DataSource, DataSourceOptions } from 'typeorm';
import { DashboardCacheEntity, DashboardEntity, GraphicEntity } from '../entities';
import { VariablesEntity } from '../entities/VariablesEntity';
import { AuthorizationLibDefaultOwner } from './AuthorizationLibVariables';

export class AuthenticationDataSource extends DataSource {
  constructor(database: DataSourceOptions) {
    super({
      ...database,
      entities: [GraphicEntity, DashboardEntity, VariablesEntity, DashboardCacheEntity],
      name: AuthorizationLibDefaultOwner,
    });
  }
}
