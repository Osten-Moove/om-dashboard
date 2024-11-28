import { ExceptionDTO, filterSeparate, RejectedInputDTO, ServiceDTO } from '@duaneoli/base-project-nest';
import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { all, create } from 'mathjs';
import { In, Repository } from 'typeorm';
import { VariablesEntity } from '../entities/VariablesEntity';
import { ErrorCodeEnum } from '../enums/ErrorCodeEnum';
import { createUniqueHash } from '../helpers/CreateHash';
import { replaceFunctionCall } from '../helpers/query';
import { DashboardQueriesModule } from '../module/DashboardQueriesModule';
import { CreateVariable, OperationType, UpdateVariablesType, VariableType } from '../types/VariablesTypes';

dayjs.extend(utc);

@Injectable()
export class VariablesService {
  private repository: Repository<VariablesEntity>;
  private queries = {
    selectIFexists: (id: string, params: Array<string>) =>
      `SELECT 1 FROM variable_cache WHERE variable_id = '${id}' and params = '${createUniqueHash(params)}' and updated_at > '${dayjs().utc().subtract(DashboardQueriesModule.config.variableCacheMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss')}'`,
    selectValueOfCache: (id: string, params: Array<string>) =>
      `SELECT value::numeric FROM variable_cache WHERE variable_id = '${id}' and params = '${createUniqueHash(params)}'`,
    case: (id: string, query: string, params: Array<string>) =>
      `SELECT CASE WHEN EXISTS (${this.queries.selectIFexists(id, params)}) THEN (${this.queries.selectValueOfCache(id, params)}) ELSE (${query}) END AS value`,
  };

  constructor() {
    this.repository = DashboardQueriesModule.connection.getRepository(VariablesEntity);
  }

  private async cacheVariable(variableEntity: VariablesEntity, params: Array<string>, refresh: boolean = false) {
    const sql = `
                  WITH computed_value AS (
                    ${refresh ? variableEntity.query : this.queries.case(variableEntity.id, variableEntity.query, params)}
                  ),
                  upsert_cache AS (
                  INSERT INTO variable_cache (variable_id,params, value)
                  SELECT 
                  '${variableEntity.id}' AS variable_id,
                  '${createUniqueHash(params)}' AS params,
                  value AS value
                  FROM computed_value
                  ${refresh ? '' : `WHERE NOT EXISTS (${this.queries.selectIFexists(variableEntity.id, params)})`}
                  ON CONFLICT (variable_id, params) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP 
                  RETURNING value
                  )
                  SELECT value FROM computed_value;
                `;
    try {
      return await this.execute(sql, params);
    } catch (error) {
      throw ExceptionDTO.warn(error.message, 'Query failed, query executed: ' + error.query);
    }
  }

  async create(data: CreateVariable): Promise<VariablesEntity | ErrorCodeEnum> {
    try {
      return await this.repository.save(data);
    } catch (cause) {
      return cause;
    }
  }

  async list() {
    return new ServiceDTO(await this.repository.find());
  }

  async update(data: Array<UpdateVariablesType>) {
    const variablesInDatabase = await this.repository.find({ where: { id: In(data.map((it) => it.id)) } });
    const [process] = filterSeparate(data, () => variablesInDatabase.some((it) => it.id === it.id));

    const saveEntities = await this.repository.save(process);
    return new ServiceDTO(saveEntities);
  }

  async execute(query: string, params?: Array<string>): Promise<number> {
    const sql = replaceFunctionCall(query, [...(params || [])]);
    const countResult = await this.repository.query(sql);

    if (!countResult || countResult.length === 0 || !countResult[0].value) return null;
    return Number(countResult[0].value);
  }

  async getVariableCalc(id: string, params?: Array<string>) {
    const entity = await this.repository.findOne({ where: { id } });

    try {
      const countResult = await this.execute(entity.query, params);
      return { ...entity, value: countResult };
    } catch (error) {
      throw ExceptionDTO.warn(error.message, 'Query failed, query executed: ' + error.query);
    }
  }

  async operationCalcVariables(operations: Array<OperationType>, refresh: boolean = false) {
    const rejectedInputs = new Array<RejectedInputDTO>();
    const variablesId = operations.flatMap((it) => Object.values(it.variables).map((itt) => itt.id));
    const entities = await this.repository.find({ where: { id: In(variablesId) } });

    variablesId
      .filter((variable) => !entities.some((entity) => String(entity.id) === String(variable)))
      .forEach((variable) => {
        rejectedInputs.push(new RejectedInputDTO(String(variable), 'Variable not found in database', 0));
      });
    if (rejectedInputs.length > 0)
      throw ExceptionDTO.warn('Variables not found', 'Some variables not found in database', rejectedInputs);

    const newOperations = new Array<
      Omit<OperationType, 'variables'> & { variables: Record<string, string>; result?: any }
    >();
    const variablesToPromise: Record<string, VariableType> = {};

    operations.forEach((operation) => {
      const newOperation = { ...operation, variables: {} };
      Object.entries(operation.variables).forEach(([key, value]) => {
        const hash = value.id + createUniqueHash(value.params);
        newOperation.variables[key] = hash;
        variablesToPromise[hash] = value;
      });
      newOperations.push(newOperation);
    });

    const variablePromises = Object.entries(variablesToPromise).map(async ([hash, variable]) => {
      const entity = entities.find((e) => String(e.id) === String(variable.id));
      const params = [...(Array.isArray(variable.params) ? variable.params : [])];
      const result = await this.cacheVariable(entity, params, refresh);

      return {
        hash,
        value: result,
      };
    });

    const results = await Promise.all(variablePromises);
    const hashToValue = results.reduce((acc, result) => {
      acc[result.hash] = result.value;
      return acc;
    }, {});

    const math = create(all);
    newOperations.forEach((operation) => {
      Object.entries(operation.variables).forEach(([key, hash]) => {
        operation.variables[key] = hashToValue[hash];
      });

      operation.result = Object.values(operation.variables).some((value) => value === null)
        ? NaN
        : math.compile(operation.operation).evaluate(operation.variables);
    });

    return newOperations;
  }
}
