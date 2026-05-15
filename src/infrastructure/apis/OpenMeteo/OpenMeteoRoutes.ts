import { Router, Request, Response } from 'express';
import { OpenMeteoService } from './OpenMeteoService';
import { OpenMeteoController } from './OpenMeteoController';
import { validateArchiveDates, validateCoordinates } from './OpenMeteoMiddleware';

/**
 * Rotas BioScan para Open-Meteo.
 * Base: /api/meteo
 */
export function createOpenMeteoRoutes(router: Router, service: OpenMeteoService): Router {
  const controller = new OpenMeteoController(service);

  router.get('/forecast', validateCoordinates, (req: Request, res: Response) =>
    controller.getForecast(req, res)
  );

  router.get(
    '/archive',
    validateCoordinates,
    validateArchiveDates,
    (req: Request, res: Response) => controller.getArchive(req, res)
  );

  router.get('/air-quality', validateCoordinates, (req: Request, res: Response) =>
    controller.getAirQuality(req, res)
  );

  return router;
}
