import { Router, Request, Response } from 'express';
import { NasaGistempService } from './NasaGistempService';
import { NasaGistempController } from './NasaGistempController';
import {
  validateStationType,
  validateYears,
  validateMonth,
  validateStationTypeBody
} from './NasaGistempMiddleware';

/**
 * NASA GISTEMP Routes
 * Defines all routes for NASA GISTEMP API endpoints
 * 
 * @param router - Express Router instance
 * @param service - NasaGistempService instance
 * @returns Configured Express Router
 */
export function createNasaGistempRoutes(router: Router, service: NasaGistempService): Router {
  const controller = new NasaGistempController(service);

  // GET /api/global-temperature - Get temperature data
  router.get(
    '/',
    validateStationType,
    validateYears,
    validateMonth,
    (req: Request, res: Response) => controller.getTemperature(req, res)
  );

  // GET /api/global-temperature/stats - Get temperature statistics
  router.get(
    '/stats',
    validateStationType,
    (req: Request, res: Response) => controller.getTemperatureStats(req, res)
  );

  // GET /api/global-temperature/sync-status - Get sync service status
  router.get(
    '/sync-status',
    (_req: Request, res: Response) => controller.getSyncStatus(_req, res)
  );

  // POST /api/global-temperature/sync - Trigger manual sync
  router.post(
    '/sync',
    validateStationTypeBody,
    (req: Request, res: Response) => controller.triggerSync(req, res)
  );

  return router;
}
