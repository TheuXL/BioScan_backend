import { Router, Request, Response } from 'express';
import { GlobeController } from './GlobeController';
import { GlimsService } from '../GLIMS/GlimsService';
import { UsgsEarthquakeService } from '../UsgsEarthquake/UsgsEarthquakeService';
import { OceanPollutionService } from '../OceanPollution/OceanPollutionService';
import { GLOBE_SCHEMA_VERSION, LIMITS } from './GlobeTypes';
import { validateGlobeLimit } from './GlobeMiddleware';
import {
  validateSource as validateFireSource,
  validateDates as validateFireDates,
  validateLimit as validateFireLimitOpen
} from '../NASA/NasaFire/NasaFireMiddleware';

/**
 * Incêndios normalizados (`PontoGloboV1`), por fornecedor.
 * Base: `/api/fire`
 */
export function createGlobeFireRoutes(
  router: Router,
  deps: { usgs: UsgsEarthquakeService; ocean: OceanPollutionService; glims: GlimsService }
): Router {
  const controller = new GlobeController(deps);

  router.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      schemaVersion: GLOBE_SCHEMA_VERSION,
      dominio: 'fire',
      contrato:
        'RespostaCamadaGloboV1 — cada ponto usa `tipo: "incendio"`; escolha o fornecedor no path.',
      fornecedores: [
        {
          id: 'nasa',
          nomeExibicao: 'NASA FIRMS (via BioScan / Mongo)',
          caminho: '/api/fire/nasa',
          origemDadosUpstream: '/api/fires',
          parametrosQuery: ['limit', 'offset', 'source', 'startDate', 'endDate']
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
    '/nasa',
    validateFireSource,
    validateFireDates,
    validateFireLimitOpen,
    validateGlobeLimit,
    (req: Request, res: Response) => controller.getIncendios(req, res)
  );

  return router;
}
