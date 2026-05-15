import { Request, Response } from 'express';
import {
  buildScopeKey,
  isMongoConnected,
  readScopeFirstPayload,
  reconcileProxyScope
} from '../../cache/proxyReconciliation';
import { singlePayloadCacheItems, withBioscanCacheMeta } from '../../cache/proxyCacheHelpers';
import { UsgsEarthquakeService } from './UsgsEarthquakeService';
import type { FeedWindow } from './UsgsEarthquakeTypes';
import {
  USGS_EARTHQUAKE_FEED_SOURCE,
  USGS_EARTHQUAKE_QUERY_SOURCE,
  resolveUsgsProxyReconciliationMode,
  resolveUsgsProxyTtlMs
} from './UsgsEarthquakeProxyCacheConfig';

const USGS_FALLBACK_NOTE =
  'USGS indisponível — resposta reconstruída a partir do cache BioScan (MongoDB).';

export class UsgsEarthquakeController {
  constructor(private readonly service: UsgsEarthquakeService) {}

  /**
   * GET /api/earthquakes — consulta FDSNWS (GeoJSON).
   */
  async queryEvents(req: Request, res: Response): Promise<void> {
    const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
    const scopeKey = buildScopeKey(USGS_EARTHQUAKE_QUERY_SOURCE, params);
    const mode = resolveUsgsProxyReconciliationMode();
    const ttlMs = resolveUsgsProxyTtlMs();

    try {
      const data = await this.service.queryEvents(params);
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: USGS_EARTHQUAKE_QUERY_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('UsgsEarthquake queryEvents:', message);
      const cached =
        isMongoConnected() && (await readScopeFirstPayload(USGS_EARTHQUAKE_QUERY_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, USGS_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter sismos (USGS).',
        error: message
      });
    }
  }

  /**
   * GET /api/earthquakes/feed/:window — feed GeoJSON agregado USGS.
   */
  async getFeed(req: Request, res: Response): Promise<void> {
    const windowParam = req.params.window as FeedWindow;
    const scopeKey = buildScopeKey(USGS_EARTHQUAKE_FEED_SOURCE, { window: String(windowParam) });
    const mode = resolveUsgsProxyReconciliationMode();
    const ttlMs = resolveUsgsProxyTtlMs();

    try {
      const data = await this.service.getFeed(windowParam);
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: USGS_EARTHQUAKE_FEED_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('UsgsEarthquake getFeed:', message);
      const cached =
        isMongoConnected() && (await readScopeFirstPayload(USGS_EARTHQUAKE_FEED_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, USGS_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter feed de sismos (USGS).',
        error: message
      });
    }
  }
}
