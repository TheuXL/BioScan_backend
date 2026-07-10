import { Router, Request, Response } from 'express';
import { GlimsService } from './GlimsService';
import { GlimsController } from './GlimsController';

/**
 * Proxy BioScan → GLIMS glacier data.
 * Base: /api/glaciers
 */
export function createGlimsRoutes(router: Router, service: GlimsService): Router {
  const controller = new GlimsController(service);

  router.get('/', (req: Request, res: Response) => controller.getInfo(req, res));
  router.get('/capabilities', (req: Request, res: Response) => controller.getCapabilities(req, res));
  router.get('/layers/:layerName/geojson', (req: Request, res: Response) => controller.getLayerGeojson(req, res));

  return router;
}
