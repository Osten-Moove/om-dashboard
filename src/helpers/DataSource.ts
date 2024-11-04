import { VariablesEntity } from '../entities/VariablesEntity';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AuthorizationLibDefaultOwner } from './AuthorizationLibVariables';

export class AuthenticationDataSource extends DataSource {
  constructor(database: DataSourceOptions) {
    super({
      ...database,
      entities: [VariablesEntity],
      name: AuthorizationLibDefaultOwner,
    });
  }
}
