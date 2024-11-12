import { UnitMeasureEnum } from '../entities/VariablesEntity';

export type CreateVariable = {
  id?: string;
  alias: string;
  query: string;
  description: string;
  unitOfMeasure: UnitMeasureEnum;
  isActive?: boolean;
};

export type UpdateVariablesType = {
  id: string;
  alias: string;
  query: string;
  description: string;
  unitOfMeasure: UnitMeasureEnum;
  isActive: boolean;
};

export type VariableType = {
  id: string;
  params: Array<string>;
};

export type OperationType = {
  identify: string;
  operation: string;
  variables: Record<string, VariableType>;
};
