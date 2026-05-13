import { Router, Request, Response } from 'express';
import { UsgsEarthquakeService } from './UsgsEarthquakeService';
import { UsgsEarthquakeController } from './UsgsEarthquakeController';
import { validateEventQuery, validateFeedWindow } from './UsgsEarthquakeMiddleware';

/**
 * Rotas BioScan para USGS Earthquakes.
 * Base: /api/earthquakes
 */
export function createUsgsEarthquakeRoutes(
  router: Router,
  service: UsgsEarthquakeService
): Router {
  const controller = new UsgsEarthquakeController(service);

  router.get('/feed/:window', validateFeedWindow, (req: Request, res: Response) =>
    controller.getFeed(req, res)
  );

  router.get('/', validateEventQuery, (req: Request, res: Response) =>
    controller.queryEvents(req, res)
  );

  return router;
}
