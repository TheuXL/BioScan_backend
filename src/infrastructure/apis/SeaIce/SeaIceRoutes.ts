import { Router } from 'express';
import { SeaIceService } from './SeaIceService';
import { SeaIceController } from './SeaIceController';
import { validateSeaIceLayerName, validateSeaIceQuery } from './SeaIceMiddleware';

export function createSeaIceRoutes(router: Router, service: SeaIceService): Router {
  const controller = new SeaIceController(service);

  router.get('/', (req, res) => controller.getInfo(req, res));
  
  router.get('/capabilities', (req, res) => controller.getCapabilities(req, res));

  router.get(
    '/layers/:layerName/geojson',
    validateSeaIceLayerName, 
    validateSeaIceQuery,
    (req, res) => controller.getLayerGeojson(req, res)
  );

  return router;
}