import { Router, Request, Response } from 'express';
import { NasaEonetService } from './NasaEonetService';
import { NasaEonetController } from './NasaEonetController';
import {
  validateCategoryIdParam,
  validateEventListQuery,
  validateLayerCategoryIdParam
} from './NasaEonetMiddleware';

/**
 * Rotas BioScan para NASA EONET v2.1.
 * Base: /api/events
 */
export function createNasaEonetRoutes(router: Router, service: NasaEonetService): Router {
  const controller = new NasaEonetController(service);

  router.get('/sources', (req: Request, res: Response) => controller.listSources(req, res));

  router.get('/categories', (req: Request, res: Response) => controller.listCategories(req, res));

  router.get(
    '/categories/:categoryId',
    validateCategoryIdParam,
    validateEventListQuery,
    (req: Request, res: Response) => controller.getCategoryEvents(req, res)
  );

  router.get('/layers', (req: Request, res: Response) => controller.listLayers(req, res));

  router.get('/layers/:categoryId', validateLayerCategoryIdParam, (req: Request, res: Response) =>
    controller.getLayersByCategory(req, res)
  );

  router.get('/', validateEventListQuery, (req: Request, res: Response) =>
    controller.getEvents(req, res)
  );

  return router;
}
