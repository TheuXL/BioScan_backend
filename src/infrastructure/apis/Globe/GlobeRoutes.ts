import { Router, Request, Response } from 'express';
import { GlobeController } from './GlobeController';
import { UsgsEarthquakeService } from '../UsgsEarthquake/UsgsEarthquakeService';
import { OceanPollutionService } from '../OceanPollution/OceanPollutionService';
import { validateGlobeLimit, validateGlobeThreatFilters } from './GlobeMiddleware';

/**
 * Índice de camadas do globo + rotas que ainda não têm domínio dedicado (`fire` / `ocean`).
 * Incêndios: `/api/fire/nasa`. Oceano (EPA): `/api/ocean/epa`.
 * Base: `/api/globe`
 */
export function createGlobeRoutes(
  router: Router,
  deps: { usgs: UsgsEarthquakeService; ocean: OceanPollutionService }
): Router {
  const controller = new GlobeController(deps);

  router.get('/', (req: Request, res: Response) => controller.getDiscovery(req, res));

  router.get(
    '/especies-ameacadas',
    validateGlobeLimit,
    validateGlobeThreatFilters,
    (req: Request, res: Response) => controller.getEspeciesAmeacadas(req, res)
  );

  router.get('/sismos', validateGlobeLimit, (req: Request, res: Response) => controller.getSismos(req, res));

  return router;
}
