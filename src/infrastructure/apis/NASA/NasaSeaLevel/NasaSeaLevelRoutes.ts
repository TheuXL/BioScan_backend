import { Router, Request, Response } from 'express';
import { NasaSeaLevelService } from './NasaSeaLevelService';
import { NasaSeaLevelController } from './NasaSeaLevelController';

/**
 * Sea level / ice-melt routes (Climate Tools proxy + MongoDB snapshot).
 * Base path: /api/ice-melt
 */
export function createNasaSeaLevelRoutes(router: Router, service: NasaSeaLevelService): Router {
  const controller = new NasaSeaLevelController(service);

  router.get('/', (req: Request, res: Response) => controller.getSeaLevelLive(req, res));

  router.get('/latest', (req: Request, res: Response) => controller.getSeaLevelLatest(req, res));

  router.get('/sync-status', (req: Request, res: Response) => controller.getSyncStatus(req, res));

  router.post('/sync', (req: Request, res: Response) => controller.triggerSync(req, res));

  return router;
}
