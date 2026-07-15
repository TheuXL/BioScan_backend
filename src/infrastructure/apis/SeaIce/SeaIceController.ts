import { Request, Response } from 'express';
import {
  buildScopeKey,
  isMongoConnected,
  readScopeFirstPayload,
  reconcileProxyScope
} from '../../cache/proxyReconciliation';
import { singlePayloadCacheItems, withBioscanCacheMeta } from '../../cache/proxyCacheHelpers';
import { SeaIceService } from './SeaIceService';
import { SEAICE_API_CONFIG, SEAICE_LAYER_ALIASES } from './SeaIceTypes';
import {
  SEAICE_CAPABILITIES_SOURCE,
  SEAICE_LAYER_GEOJSON_SOURCE,
  SEAICE_PROXY_FALLBACK_NOTE,
  resolveSeaIceProxyReconciliationMode,
  resolveSeaIceProxyTtlMs
} from './SeaIceProxyCacheConfig';

export class SeaIceController {
  constructor(private readonly service: SeaIceService) {}

  
  async getInfo(_req: Request, res: Response): Promise<void> {
    res.json({
      provider: 'BioScan proxy — NSIDC Sea Ice Data',
      documentation: 'https://nsidc.org/data/user-resources/programmatic-access',
      basePath: '/api/sea-ice',
      defaultLayer: SEAICE_API_CONFIG.DEFAULT_LAYER,
      supportedAliases: Object.keys(SEAICE_LAYER_ALIASES),
      requiresApiKey: false
    });
  }

 
  async getCapabilities(_req: Request, res: Response): Promise<void> {
    const scopeKey = buildScopeKey(SEAICE_CAPABILITIES_SOURCE, {});
    const mode = resolveSeaIceProxyReconciliationMode();
    const ttlMs = resolveSeaIceProxyTtlMs();

    try {
      const data = await this.service.getCapabilities();

      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: SEAICE_CAPABILITIES_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }

      res.status(200).type('application/xml').send(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('SeaIce getCapabilities:', message);

     
      const cached = isMongoConnected() 
        ? await readScopeFirstPayload(SEAICE_CAPABILITIES_SOURCE, scopeKey) 
        : null;
      
      
      if (cached) {
        res.status(200)
           .type('application/xml')
           .set('X-BioScan-Fallback', 'true')
           .send(cached);
        return;
      }
      
     
      res.status(502).json({ 
        message: 'NSIDC unreachable and no cache available', 
        error: message 
      });
    }
  }

 
  async getLayerGeojson(req: Request, res: Response): Promise<void> {
    const layerName = String(req.params.layerName || 'extent-north');
    const bbox = String(req.query.bbox || SEAICE_API_CONFIG.DEFAULT_BBOX).trim();
    const featureCount = req.query.feature_count 
      ? Number(req.query.feature_count) 
      : SEAICE_API_CONFIG.DEFAULT_FEATURE_COUNT;
    
    const options = {
      bbox,
      feature_count: featureCount
    };

    const scopeKey = buildScopeKey(SEAICE_LAYER_GEOJSON_SOURCE, { 
      layerName: this.service.resolveLayer(layerName), 
      bbox,
      feature_count: String(featureCount)
    });

    const mode = resolveSeaIceProxyReconciliationMode();
    const ttlMs = resolveSeaIceProxyTtlMs();

    try {
      const data = await this.service.getLayerGeoJson(layerName, options);

      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: SEAICE_LAYER_GEOJSON_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }

      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('SeaIce getLayerGeojson:', message);

      const cached = isMongoConnected() 
        ? await readScopeFirstPayload(SEAICE_LAYER_GEOJSON_SOURCE, scopeKey) 
        : null;
      
      if (cached) {
        res.json(withBioscanCacheMeta(cached, SEAICE_PROXY_FALLBACK_NOTE));
        return;
      }
      
      res.status(502).json({ 
        message: 'Error retrieving Sea Ice data from NSIDC and no cache found', 
        error: message 
      });
    }
  }
}