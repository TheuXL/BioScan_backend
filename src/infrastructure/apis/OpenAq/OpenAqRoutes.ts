import { Router, Request, Response } from 'express';
import { OpenAqService } from './OpenAqService';
import { OpenAqController } from './OpenAqController';
import { validateLocationIdParam, validateLocationsQuery } from './OpenAqMiddleware';

/**
 * Proxy BioScan → OpenAQ v3.
 * Base: /api/openaq
 */
export function createOpenAqRoutes(router: Router, service: OpenAqService): Router {
  const controller = new OpenAqController(service);

  router.get('/parameters', (req: Request, res: Response) => controller.getParameters(req, res));

  router.get('/countries', validateLocationsQuery, (req: Request, res: Response) =>
    controller.getCountries(req, res)
  );

  router.get('/locations', validateLocationsQuery, (req: Request, res: Response) =>
    controller.getLocations(req, res)
  );

  router.get('/locations/:id/latest', validateLocationIdParam, (req: Request, res: Response) =>
    controller.getLocationLatest(req, res)
  );

  router.get('/locations/:id', validateLocationIdParam, (req: Request, res: Response) =>
    controller.getLocationById(req, res)
  );

  return router;
}
