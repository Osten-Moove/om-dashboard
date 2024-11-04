import { ServiceDTO } from '@duaneoli/base-project-nest';
import { VariablesEntity } from '../entities/VariablesEntity';
import { ErrorCodeEnum } from '../enums/ErrorCodeEnum';
import { CreateVariable, GetCountQueriesVariablesType, ValidateVariable } from '../types/VariablesTypes';

export interface IVariablesInterface {
  create(data: CreateVariable): Promise<VariablesEntity | ErrorCodeEnum>;
  execute(query: string, params?: Array<string>): Promise<number>;
  getVariableCount(id: string, params?: Array<string>): Promise<any>;
  getQueriesVariableCount(variables: Array<GetCountQueriesVariablesType>): Promise<ServiceDTO<any>>;
  getCalc(calculations: Array<ValidateVariable>): Promise<any>;
}
