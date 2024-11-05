import { filterSeparate, RejectedInputDTO, ServiceDTO } from '@duaneoli/base-project-nest';
import { Injectable } from '@nestjs/common';
import { all, create } from 'mathjs';
import { VariablesEntity } from '../entities/VariablesEntity';
import { ErrorCodeEnum } from '../enums/ErrorCodeEnum';
import { replaceFunctionCall } from '../helpers/query';
import { IVariablesInterface } from '../interfaces/IVariablesInterface';
import { DashboardQueriesModule } from '../module/DashboardQueriesModule';
import { CreateVariable, GetCountQueriesVariablesType, ValidateVariable } from '../types/VariablesTypes';
import { In, Repository } from 'typeorm';
import { transformObject } from '../helpers/TransformObject';

@Injectable()
export class VariablesService implements IVariablesInterface {
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

  async execute(query: string, params?: Array<string>): Promise<number> {
    const sql = replaceFunctionCall(query, [...(params || [])]);
    const constResult = await this.repository.query(sql);

    if (!constResult || constResult.length === 0 || !constResult[0].value) return 0;

    return Number(constResult[0].value);
  }

  async getVariableCount(id: string, params?: Array<string>): Promise<any> {
    const entity = await this.repository.findOne({ where: { id } });
    const countResult = await this.execute(entity.query, params);
    return { ...entity, value: countResult };
  }

  async getQueriesVariableCount(variables: Array<GetCountQueriesVariablesType>): Promise<ServiceDTO<any>> {
    const rejectedInputs = new Array<RejectedInputDTO>();
    const entities = await this.repository.find({
      where: { id: In(variables.map((v) => v.id)) },
    });
    const [processable, rejected] = filterSeparate(variables, (variable) =>
      entities.some((entity) => String(entity.id) === String(variable.id)),
    );
    rejected.forEach((variable) => {
      rejectedInputs.push(new RejectedInputDTO(String(variable.id), 'Variable not found in database', 400));
    });

    const variablePromises = processable.map(async (variable) => {
      const entity = entities.find((e) => String(e.id) === String(variable.id));
      const params = [...(Array.isArray(variable.params) ? variable.params : [])];
      const result = await this.execute(entity.query, params);
      return {
        searchId: variable.searchId,
        type: entity.unitOfMeasure,
        value: result,
      };
    });

    const results = await Promise.all(variablePromises);
    return new ServiceDTO(results, results.length, rejectedInputs);
  }

  async getCalc(calculations: Array<ValidateVariable>): Promise<any> {
    const math = create(all);

    const calculationPromises = calculations.map(async (calc) => {
      const operation = math.compile(calc.operation);
      const queries = Object.values(calc.queries);

      const parsedParams: Array<GetCountQueriesVariablesType> = queries.map((value) => ({
        id: value.id as any,
        searchId: value.operator as any,
        params: value.params as any,
      }));

      const resultQueries = await this.getQueriesVariableCount(parsedParams);
      const result = resultQueries.entities;

      const scope = queries.reduce((acc, query) => {
        const counts = result.find((item) => item.searchId === query.operator).value || 0;
        acc[query.operator] = counts;
        return acc;
      }, {});

      try {
        const totalValue = operation.evaluate(scope);
        const response = transformObject([...result]);
        return { value: response, total: totalValue };
      } catch (error) {
        return { searchId: calc.searchId, count: error.message };
      }
    });

    const results = await Promise.all(calculationPromises);
    return new ServiceDTO(results, results.length, []);
  }
}
