import { Request, Response } from 'express';
import {
  buildScopeKey,
  isMongoConnected,
  readScopeFirstPayload,
  reconcileProxyScope
} from '../../cache/proxyReconciliation';
import { singlePayloadCacheItems, withBioscanCacheMeta } from '../../cache/proxyCacheHelpers';
import { GlimsService } from './GlimsService';
import { GLIMS_API_CONFIG, GLIMS_LAYER_ALIASES } from './GlimsTypes';
import {
  GLIMS_CAPABILITIES_SOURCE,
  GLIMS_LAYER_GEOJSON_SOURCE,
  GLIMS_PROXY_FALLBACK_NOTE,
  resolveGlimsProxyReconciliationMode,
  resolveGlimsProxyTtlMs
} from './GlimsProxyCacheConfig';

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
    const scopeKey = buildScopeKey(GLIMS_CAPABILITIES_SOURCE, {});
    const mode = resolveGlimsProxyReconciliationMode();
    const ttlMs = resolveGlimsProxyTtlMs();

    try {
      const data = await this.service.getCapabilities();
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: GLIMS_CAPABILITIES_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.type('application/xml').send(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Glims getCapabilities:', message);
      const cached = isMongoConnected() && (await readScopeFirstPayload(GLIMS_CAPABILITIES_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, GLIMS_PROXY_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({ message: 'Could not retrieve GLIMS capabilities.', error: message });
    }
  }

  async getLayerGeojson(req: Request, res: Response): Promise<void> {
    const layerName = String(req.params.layerName || 'outlines');
    const bbox = String(req.query.bbox || GLIMS_API_CONFIG.DEFAULT_BBOX).trim();
    const srs = String(req.query.srs || GLIMS_API_CONFIG.DEFAULT_SRS).trim().toUpperCase();
    const cqlFilter = req.query.cql_filter ? String(req.query.cql_filter).trim() : undefined;
    const featureCount = req.query.feature_count
      ? Number(req.query.feature_count)
      : GLIMS_API_CONFIG.DEFAULT_FEATURE_COUNT;
    const featureCountEffective = Number.isFinite(featureCount)
      ? featureCount
      : GLIMS_API_CONFIG.DEFAULT_FEATURE_COUNT;
    const scopeKey = buildScopeKey(GLIMS_LAYER_GEOJSON_SOURCE, {
      layerName: this.service.resolveLayer(layerName),
      bbox,
      srs,
      cql_filter: cqlFilter ?? '',
      feature_count: String(featureCountEffective)
    });
    const mode = resolveGlimsProxyReconciliationMode();
    const ttlMs = resolveGlimsProxyTtlMs();

    try {
      const data = await this.service.getLayerGeoJson(layerName, {
        bbox,
        srs,
        cql_filter: cqlFilter,
        feature_count: featureCountEffective
      });

      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: GLIMS_LAYER_GEOJSON_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Glims getLayerGeojson:', message);
      const cached = isMongoConnected() && (await readScopeFirstPayload(GLIMS_LAYER_GEOJSON_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, GLIMS_PROXY_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({ message: 'Could not retrieve GLIMS GeoJSON.', error: message });
    }
  }
}
