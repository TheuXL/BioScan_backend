import { Router, Request, Response } from 'express';
import { OceanPollutionService } from './OceanPollutionService';
import { OceanPollutionController } from './OceanPollutionController';
import {
  validateDatasetParam,
  validateLayerIdParam,
  validateQueryOptions
} from './OceanPollutionMiddleware';

/**
 * Proxy BioScan → EPA ArcGIS (R9 Marine Debris).
 * Base: /api/ocean-pollution
 */
export function createOceanPollutionRoutes(router: Router, service: OceanPollutionService): Router {
  const c = new OceanPollutionController(service);

  router.get('/', (req: Request, res: Response) => c.getInfo(req, res));

  router.get(
    '/epa-r9/:dataset/metadata',
    validateDatasetParam,
    (req: Request, res: Response) => c.getMetadata(req, res)
  );

  router.get(
    '/epa-r9/:dataset/layers/:layerId/geojson',
    validateDatasetParam,
    validateLayerIdParam,
    validateQueryOptions,
    (req: Request, res: Response) => c.getLayerGeojson(req, res)
  );

  return router;
}
