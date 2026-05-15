import { Router, Request, Response } from 'express';
import { ExtinctionService } from './ExtinctionService';
import { ExtinctionController } from './ExtinctionController';
import { validateOccurrenceListQuery, validateSyncBody } from './ExtinctionMiddleware';

/**
 * Espécies em risco — ocorrências GBIF com categorias IUCN.
 * Base: /api/extinction
 */
export function createExtinctionRoutes(router: Router, service: ExtinctionService): Router {
  const c = new ExtinctionController(service);

  router.get('/', validateOccurrenceListQuery, (req: Request, res: Response) => c.getOccurrences(req, res));
  router.get('/sync-status', (req: Request, res: Response) => c.getSyncStatus(req, res));
  router.post('/sync', validateSyncBody, (req: Request, res: Response) => c.triggerSync(req, res));

  return router;
}
