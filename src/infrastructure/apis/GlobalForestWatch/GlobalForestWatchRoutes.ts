import { Router, Request, Response } from 'express';
import { GlobalForestWatchService } from './GlobalForestWatchService';
import { GlobalForestWatchController } from './GlobalForestWatchController';
import {
  validateDatasetVersionParams,
  validateSqlQueryParam
} from './GlobalForestWatchMiddleware';

/**
 * Proxy BioScan → GFW Data API.
 * Base: /api/deforestation
 */
export function createGlobalForestWatchRoutes(
  router: Router,
  service: GlobalForestWatchService
): Router {
  const c = new GlobalForestWatchController(service);

  router.get('/', (req: Request, res: Response) => c.getInfo(req, res));
  router.get('/ping', (req: Request, res: Response) => c.getPing(req, res));
  router.get('/datasets', (req: Request, res: Response) => c.getDatasets(req, res));

  router.get(
    '/dataset/:dataset/:version/query/json',
    validateDatasetVersionParams,
    validateSqlQueryParam,
    (req: Request, res: Response) => c.queryJson(req, res)
  );

  router.get(
    '/dataset/:dataset/:version/fields',
    validateDatasetVersionParams,
    (req: Request, res: Response) => c.getFields(req, res)
  );

  return router;
}
