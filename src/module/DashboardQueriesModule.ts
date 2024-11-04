import { DynamicModule, Global, Module } from '@nestjs/common';
import { VariablesEntity } from '../entities/VariablesEntity';
import { AuthorizationLibDefaultOwner } from '../helpers/AuthorizationLibVariables';
import { AuthenticationDataSource } from '../helpers/DataSource';
import { VariablesService } from '../services/VariablesService';
import { DataSource, DataSourceOptions } from 'typeorm';
import { DecoratorConfig } from '../types/types';
import { Logger } from '@duaneoli/base-project-nest';

@Global()
@Module({})
export class DashboardQueriesModule {
  static connection: DataSource;
  static config: DecoratorConfig;
  static forRoot(database: DataSourceOptions, config?: DecoratorConfig): DynamicModule {
    this.config = config;
    if (!this.config.secondarySecret) this.config.secondarySecret = this.config.secret + 'secondary';
    const entities = [VariablesEntity];
    const services = [VariablesService];
    const imports = [];
    const exports = [...services];
    const providers = [...services];

    this.connection = new AuthenticationDataSource({
      ...database,
      entities,
      name: AuthorizationLibDefaultOwner,
    });

    if (!this.config.appName) this.config.appName = 'OM-DASHBOARD-QUERIES';
    if (this.config.debug) Logger.debug('DashboardQueriesModule Initialized');

    return {
      global: true,
      module: DashboardQueriesModule,
      imports,
      providers,
      exports,
    };
  }

  async onModuleInit() {
    await DashboardQueriesModule.connection.initialize();
  }

  async onModuleDestroy() {
    await DashboardQueriesModule.connection.destroy();
  }
}
