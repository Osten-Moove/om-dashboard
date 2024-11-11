import { GraphicMetrics, GraphicType } from '../enums/GraphicEnum';

export type CreateGraphicType = {
  title: string;
  metrics: GraphicMetrics;
  type: GraphicType;
  dataFunctions: object;
};

export type UpdateGraphicType = {
  id: string;
  title?: string;
  metrics?: GraphicMetrics;
  type?: GraphicType;
  dataFunctions?: object;
};

export type DeleteGraphicType = {
  id: string;
};
