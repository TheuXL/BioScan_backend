import { Request, Response } from 'express';
import {
  buildScopeKey,
  isMongoConnected,
  readScopeFirstPayload,
  reconcileProxyScope
} from '../../cache/proxyReconciliation';
import { singlePayloadCacheItems, withBioscanCacheMeta } from '../../cache/proxyCacheHelpers';
import { OpenMeteoService } from './OpenMeteoService';
import {
  OPENMETEO_AIR_QUALITY_SOURCE,
  OPENMETEO_ARCHIVE_SOURCE,
  OPENMETEO_FORECAST_SOURCE,
  resolveOpenMeteoProxyReconciliationMode,
  resolveOpenMeteoProxyTtlMs
} from './OpenMeteoProxyCacheConfig';

const METEO_FALLBACK_NOTE = 'Open-Meteo indisponível — resposta reconstruída a partir do cache BioScan (MongoDB).';

export class OpenMeteoController {
  constructor(private readonly service: OpenMeteoService) {}

  /**
   * GET /api/meteo/forecast — previsão e tempo atual.
   */
  async getForecast(req: Request, res: Response): Promise<void> {
    const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
    const scopeKey = buildScopeKey(OPENMETEO_FORECAST_SOURCE, params);
    const mode = resolveOpenMeteoProxyReconciliationMode();
    const ttlMs = resolveOpenMeteoProxyTtlMs();

    try {
      const data = await this.service.getForecast(params);
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: OPENMETEO_FORECAST_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenMeteo getForecast:', message);
      const cached =
        isMongoConnected() && (await readScopeFirstPayload(OPENMETEO_FORECAST_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, METEO_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter dados meteorológicos (Open-Meteo).',
        error: message
      });
    }
  }

  /**
   * GET /api/meteo/archive — série histórica (arquivo).
   */
  async getArchive(req: Request, res: Response): Promise<void> {
    const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
    const scopeKey = buildScopeKey(OPENMETEO_ARCHIVE_SOURCE, params);
    const mode = resolveOpenMeteoProxyReconciliationMode();
    const ttlMs = resolveOpenMeteoProxyTtlMs();

    try {
      const data = await this.service.getArchive(params);
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: OPENMETEO_ARCHIVE_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenMeteo getArchive:', message);
      const cached =
        isMongoConnected() && (await readScopeFirstPayload(OPENMETEO_ARCHIVE_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, METEO_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter dados históricos (Open-Meteo Archive).',
        error: message
      });
    }
  }

  /**
   * GET /api/meteo/air-quality — qualidade do ar (API dedicada Open-Meteo).
   */
  async getAirQuality(req: Request, res: Response): Promise<void> {
    const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
    const scopeKey = buildScopeKey(OPENMETEO_AIR_QUALITY_SOURCE, params);
    const mode = resolveOpenMeteoProxyReconciliationMode();
    const ttlMs = resolveOpenMeteoProxyTtlMs();

    try {
      const data = await this.service.getAirQuality(params);
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: OPENMETEO_AIR_QUALITY_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenMeteo getAirQuality:', message);
      const cached =
        isMongoConnected() &&
        (await readScopeFirstPayload(OPENMETEO_AIR_QUALITY_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, METEO_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter qualidade do ar (Open-Meteo).',
        error: message
      });
    }
  }
}
