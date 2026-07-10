import { Request, Response } from 'express';
import { GlimsService } from './GlimsService';
import { GLIMS_API_CONFIG, GLIMS_LAYER_ALIASES } from './GlimsTypes';

export class GlimsController {
  constructor(private readonly service: GlimsService) {}

  async getInfo(_req: Request, res: Response): Promise<void> {
    res.json({
      provider: 'BioScan proxy — GLIMS glacier data',
      documentation: 'https://www.glims.org/glacierdata/',
      terms: 'https://nsidc.org/about/data-use-and-copyright',
      basePath: '/api/glaciers',
      endpoints: {
        capabilities: 'GET /api/glaciers/capabilities',
        layerGeoJson: 'GET /api/glaciers/layers/:layerName/geojson?bbox=...&feature_count=...'
      },
      defaultLayer: GLIMS_API_CONFIG.DEFAULT_LAYER,
      layers: {
        outlines: GLIMS_LAYER_ALIASES.outlines,
        rgi: GLIMS_LAYER_ALIASES.rgi,
        rgi70: GLIMS_LAYER_ALIASES.rgi70,
        extinct: GLIMS_LAYER_ALIASES.extinct
      },
      upstreamBase: GLIMS_API_CONFIG.WMS_BASE_URL,
      requiresApiKey: false
    });
  }

  async getCapabilities(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.getCapabilities();
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ message: 'Could not retrieve GLIMS capabilities.', error: message });
    }
  }

  async getLayerGeojson(req: Request, res: Response): Promise<void> {
    try {
      const layerName = String(req.params.layerName || 'outlines');
      const bbox = String(req.query.bbox || GLIMS_API_CONFIG.DEFAULT_BBOX);
      const width = Number(req.query.width ?? GLIMS_API_CONFIG.DEFAULT_WIDTH);
      const height = Number(req.query.height ?? GLIMS_API_CONFIG.DEFAULT_HEIGHT);
      const srs = String(req.query.srs || GLIMS_API_CONFIG.DEFAULT_SRS);
      const cqlFilter = req.query.cql_filter ? String(req.query.cql_filter) : undefined;
      const featureCount = req.query.feature_count ? Number(req.query.feature_count) : undefined;

      const data = await this.service.getLayerGeoJson(layerName, {
        bbox,
        width: Number.isFinite(width) ? width : GLIMS_API_CONFIG.DEFAULT_WIDTH,
        height: Number.isFinite(height) ? height : GLIMS_API_CONFIG.DEFAULT_HEIGHT,
        srs,
        cql_filter: cqlFilter,
        feature_count: Number.isFinite(featureCount) ? featureCount : undefined
      });

      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ message: 'Could not retrieve GLIMS GeoJSON.', error: message });
    }
  }
}
