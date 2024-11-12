import { ExceptionDTO, filterSeparate, RejectedInputDTO, ServiceDTO } from '@duaneoli/base-project-nest';
import { Injectable } from '@nestjs/common';
import { all, create } from 'mathjs';
import { VariablesEntity } from '../entities/VariablesEntity';
import { ErrorCodeEnum } from '../enums/ErrorCodeEnum';
import { replaceFunctionCall } from '../helpers/query';
import { DashboardQueriesModule } from '../module/DashboardQueriesModule';
import { CreateVariable, OperationType, UpdateVariablesType, VariableType } from '../types/VariablesTypes';
import { In, Repository } from 'typeorm';
import crypto from 'crypto';

function createUniqueHash(params: Array<string>) {
  const hashParams = params.join(',');
  return crypto.createHash('sha256').update(hashParams).digest('hex');
}

@Injectable()
export class VariablesService {
  private repository: Repository<VariablesEntity>;

  constructor() {
    this.repository = DashboardQueriesModule.connection.getRepository(VariablesEntity);
  }

  async create(data: CreateVariable): Promise<VariablesEntity | ErrorCodeEnum> {
    try {
      return await this.repository.save(data);
    } catch (cause) {
      return cause;
    }
  }

  async update(data: Array<UpdateVariablesType>) {
    const variablesInDatabase = await this.repository.find({ where: { id: In(data.map((it) => it.id)) } });
    const [process, reject] = filterSeparate(data, () => variablesInDatabase.some((it) => it.id === it.id));

    const saveEntities = await this.repository.save(process);
    return new ServiceDTO(saveEntities);
  }

  async execute(query: string, params?: Array<string>): Promise<number> {
    const sql = replaceFunctionCall(query, [...(params || [])]);
    const countResult = await this.repository.query(sql);

    if (!countResult || countResult.length === 0 || !countResult[0].value)
      throw ExceptionDTO.warn('Não foi possível obter a contagem.', 'Verify if sql return column value');

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

  async operationCalcVariables(operations: Array<OperationType>) {
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
      const result = await this.execute(entity.query, params);
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
      operation.result = math.compile(operation.operation).evaluate(operation.variables);
    });

    return newOperations;
  }
}
