import { UnitMeasureEnum } from '../entities/VariablesEntity';

export type CreateVariable = {
  id?: string;
  alias: string;
  query: string;
  description: string;
  unitOfMeasure: UnitMeasureEnum;
  isActive?: boolean;
};

export type ValidateVariable = {
  searchId: string;
  operation: string;
  queries?: Array<{
    operator: string;
    id: string;
    params?: Array<string>;
  }>;
};

export type GetCountQueriesVariablesType = {
  id: string;
  searchId: string;
  params: string;
};
