import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GraphicEntity } from '../entities/GraphicEntity';
import { DashboardEntity } from '../entities/DashboardEntity';
import { VariablesService } from './VariablesService';
import { CreateGraphicType, DeleteGraphicType, UpdateGraphicType } from '../types/GraphicTypes';
import { ServiceDTO } from '@duaneoli/base-project-nest';
import { all, create } from 'mathjs';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GraphicService {
  constructor(
    @InjectRepository(DashboardEntity)
    private readonly dashboardRepository: Repository<DashboardEntity>,
    @InjectRepository(GraphicEntity)
    private readonly graphicRepository: Repository<GraphicEntity>,
  ) {}

  async create(dashboardId: string, { title, type, metrics, dataFunctions }: CreateGraphicType) {
    const dashboardExists = await this.dashboardRepository.findOne({
      where: { id: dashboardId },
    });

    if (!dashboardExists) throw Error('Dashboard Not Found!');

    const createGraphic = await this.graphicRepository.save({
      title,
      metrics,
      type,
      dataFunctions,
      dashboard: {
        id: dashboardExists.id,
      },
    });

    return new ServiceDTO([createGraphic]);
  }

  async update({ id, ...query }: UpdateGraphicType) {
    const graphicExists = await this.graphicRepository.findOne({
      where: { id },
    });

    if (!graphicExists) throw Error('Graphic not found!');

    Object.assign(graphicExists, { ...query });

    const updateGraphic = await this.graphicRepository.save(graphicExists);

    return new ServiceDTO([updateGraphic]);
  }

  async delete(body: Array<DeleteGraphicType>) {
    const listErrors = [];

    const graphicExists = await Promise.all(
      body.map(async (item) => {
        const itemExists = await this.graphicRepository.findOne({
          where: { id: item.id },
        });

        if (!itemExists) {
          listErrors.push({
            type: 'not found',
            id: item.id,
          });
        }

        return itemExists;
      }),
    );

    if (listErrors.length === body.length) throw Error('Grafics were not found!');

    const filterGraphics = graphicExists.filter((item) => item !== null);

    await this.graphicRepository.delete(filterGraphics.map((item) => item.id));

    const response =
      listErrors.length > 0
        ? { message: 'partial deleted successfuly', errors: listErrors }
        : { message: 'all deleted successfully' };

    return new ServiceDTO([{ response }]);
  }

  async generateGraph(graph: GraphicEntity) {
    const graphData: any = graph;

    const dataFunctions = Object(graph.dataFunctions).variables;

    const convertVariablesToArray = Object.entries(dataFunctions).map(([key, value]) => {
      const convertValueToObject = Object(value);
      const getQueryValues = convertValueToObject.queries;

      const adjustQueryValues = {};
      Object.entries(getQueryValues).forEach(([queryKey, queryValue]) => {
        adjustQueryValues[queryKey] = queryValue;
      });

      const structureReturn = {
        identify: key,
        operation: convertValueToObject.operation,
        variables: adjustQueryValues,
      };

      return structureReturn;
    });

    const variableService = new VariablesService();
    const calculationResults = await variableService.operationCalcVariables(convertVariablesToArray);

    const scopeVariables = calculationResults.reduce((acc, entity) => {
      acc[entity.identify] = entity.result;
      return acc;
    }, {});

    const math = create(all);
    graphData.dataFunctions.data.map((dataPoint) => {
      Object.entries(dataPoint).forEach(([key, expression]: any) => {
        try {
          dataPoint[key] = math.compile(expression).evaluate(scopeVariables);
        } catch (cause) {
          throw Error(cause);
          dataPoint[key] = dataPoint[key];
        }
      });
    });

    return { title: graph.title, type: graph.type, data: graphData.dataFunctions.data };
  }

  private replaceVariablesWithParams(listQueries: string, params: Array<string>) {
    let replacedString = listQueries;

    params
      .join(',')
      .split(',')
      .forEach((param) => {
        replacedString = replacedString.replace('$', param.trim());
      });

    return replacedString;
  }

  async generateMultipleGraphs(dashboardId: string, params: Array<string>) {
    const graphs = await this.graphicRepository.find({ where: { dashboard: { id: dashboardId } } });

    const graphsWithUnitsInserted = graphs.map((graph) => {
      const listQueries = JSON.stringify(graph.dataFunctions);
      const replaceVariablesWithUnitsIds = this.replaceVariablesWithParams(listQueries, params);
      Object.assign(graph, { dataFunctions: JSON.parse(replaceVariablesWithUnitsIds) });
      return graph;
    });

    const graph = await Promise.all(
      graphsWithUnitsInserted.map(async (graphic) => {
        const generateGraph = await this.generateGraph(graphic);

        const headers = Object.keys(generateGraph.data[0]);

        const resultStructure = {
          title: generateGraph.title,
          type: generateGraph.type,
          headers,
          dataBody: generateGraph.data,
        };

        return resultStructure;
      }),
    );

    return graph;
  }

  async searchGraphic(graphicId: string, params: string) {
    const findGraph = await this.graphicRepository.findOne({
      where: { id: graphicId },
    });

    if (!findGraph) throw Error('Grafic not found!');

    const replaceVariablesWithUnit = JSON.stringify(findGraph.dataFunctions).replaceAll('$1', params);

    Object.assign(findGraph, { dataFunctions: JSON.parse(replaceVariablesWithUnit) });

    const result = await this.generateGraph(findGraph);

    return result;
  }
}
