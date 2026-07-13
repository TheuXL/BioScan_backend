import { Router, Request, Response } from 'express';
import { GlobeController } from './GlobeController';
import { GlimsService } from '../GLIMS/GlimsService';
import { UsgsEarthquakeService } from '../UsgsEarthquake/UsgsEarthquakeService';
import { OceanPollutionService } from '../OceanPollution/OceanPollutionService';
import { GLOBE_SCHEMA_VERSION, LIMITS } from './GlobeTypes';
import { validateGlobeLimit, validateGlobeOceanQuery } from './GlobeMiddleware';

/**
 * Camadas oceânicas normalizadas (`PontoGloboV1`), por fornecedor.
 * Base: `/api/ocean`
 * Nota: proxy bruto ArcGIS continua em `/api/ocean-pollution`.
 */
export function createGlobeOceanRoutes(
  router: Router,
  deps: { usgs: UsgsEarthquakeService; ocean: OceanPollutionService; glims: GlimsService }
): Router {
  const controller = new GlobeController(deps);

  router.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      schemaVersion: GLOBE_SCHEMA_VERSION,
      dominio: 'ocean',
      contrato:
        'RespostaCamadaGloboV1 — cada ponto usa `tipo` conforme a camada (ex.: `lixo_marinho`).',
      fornecedores: [
        {
          id: 'epa',
          nomeExibicao: 'EPA Region 9 — Marine Debris (ArcGIS)',
          caminho: '/api/ocean/epa',
          origemDadosUpstream: '/api/ocean-pollution',
          parametrosQuery: ['limit', 'offset', 'dataset', 'layerId', 'where', 'resultRecordCount']
        }
      ],
      limiteGlobo: {
        padrao: LIMITS.DEFAULT,
        min: LIMITS.MIN,
        max: LIMITS.MAX,
        offset: true
      },
      indiceAgregado: '/api/globe'
    });
  });

  router.get(
    '/epa',
    validateGlobeOceanQuery,
    validateGlobeLimit,
    (req: Request, res: Response) => controller.getLixoMarinho(req, res)
  );

  return router;
}
