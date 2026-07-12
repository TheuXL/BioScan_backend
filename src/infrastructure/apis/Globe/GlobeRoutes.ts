import { Router, Request, Response } from 'express';
import { GlobeController } from './GlobeController';
import { UsgsEarthquakeService } from '../UsgsEarthquake/UsgsEarthquakeService';
import { OceanPollutionService } from '../OceanPollution/OceanPollutionService';
import { GlimsService } from '../GLIMS/GlimsService';
import { validateGlobeLimit, validateGlobeThreatFilters } from './GlobeMiddleware';

export function createGlobeRoutes(
  router: Router,
  deps: {
    usgs: UsgsEarthquakeService;
    ocean: OceanPollutionService;
    glims: GlimsService;
  }
): Router {
  const controller = new GlobeController(deps);

  router.get('/', (req: Request, res: Response) => controller.getDiscovery(req, res));

  router.get(
    '/especies-ameacadas',
    validateGlobeLimit,
    validateGlobeThreatFilters,
    (req: Request, res: Response) => controller.getEspeciesAmeacadas(req, res)
  );

  router.get(
    '/sismos',
    validateGlobeLimit,
    (req: Request, res: Response) => controller.getSismos(req, res)
  );

  router.get(
    '/geleiras',
    validateGlobeLimit,
    (req: Request, res: Response) => controller.getGeleiras(req, res)
  );

  return router;
}