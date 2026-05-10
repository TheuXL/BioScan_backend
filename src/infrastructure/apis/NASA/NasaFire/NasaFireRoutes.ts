import { Router } from 'express';
import { NasaFireService } from './NasaFireService';
import { NasaFireController } from './NasaFireController';
import {
  validateSource,
  validateDays,
  validateCountryCode,
  validateLimit,
  validateDates
} from './NasaFireMiddleware';

/**
 * NASA Fire Routes
 * Defines all routes for NASA Fire API endpoints
 * 
 * @param router - Express router instance
 * @param service - NasaFireService instance
 * @returns Configured router
 */
export function createNasaFireRoutes(router: Router, service: NasaFireService): Router {
  const controller = new NasaFireController(service);

  /**
   * GET /api/fires
   * Get fires from MongoDB (real-time data from sync service)
   */
  router.get(
    '/',
    validateSource,
    validateLimit,
    validateDates,
    (req, res) => controller.getFires(req, res)
  );

  /**
   * GET /api/fires/by-country
   * Get fires by country code
   */
  router.get(
    '/by-country',
    validateCountryCode,
    validateSource,
    validateDays,
    (req, res) => controller.getFiresByCountry(req, res)
  );

  /**
   * GET /api/fires/sync-status
   * Get fire sync service status
   */
  router.get(
    '/sync-status',
    (req, res) => controller.getSyncStatus(req, res)
  );

  /**
   * POST /api/fires/sync
   * Manual sync trigger (for testing)
   */
  router.post(
    '/sync',
    validateSource,
    (req, res) => controller.triggerSync(req, res)
  );

  return router;
}
