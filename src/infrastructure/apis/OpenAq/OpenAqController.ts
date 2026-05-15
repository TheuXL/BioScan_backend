import { Request, Response } from 'express';
import {
  buildScopeKey,
  isMongoConnected,
  readScopeFirstPayload,
  readScopePayloads,
  reconcileProxyScope
} from '../../cache/proxyReconciliation';
import { singlePayloadCacheItems, withBioscanCacheMeta } from '../../cache/proxyCacheHelpers';
import { OpenAqService } from './OpenAqService';
import {
  OPENAQ_COUNTRIES_SOURCE,
  OPENAQ_LOCATION_BY_ID_SOURCE,
  OPENAQ_LOCATION_LATEST_SOURCE,
  OPENAQ_PARAMETERS_SOURCE,
  OPENAQ_PROXY_FALLBACK_NOTE,
  resolveOpenAqProxyReconciliationMode,
  resolveOpenAqProxyTtlMs
} from './OpenAqRestCacheConfig';
import {
  OPENAQ_LOCATIONS_CACHE_SOURCE,
  openAqLocationsResponseToItems,
  resolveOpenAqLocationsReconciliationMode,
  resolveOpenAqLocationsTtlMs,
  wrapOpenAqLocationsCacheResponse
} from './OpenAqLocationsCacheConfig';

export class OpenAqController {
  constructor(private readonly service: OpenAqService) {}

  async getLocations(req: Request, res: Response): Promise<void> {
    const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
    const scopeKey = buildScopeKey(OPENAQ_LOCATIONS_CACHE_SOURCE, params);
    const mode = resolveOpenAqLocationsReconciliationMode();
    const ttlMs = resolveOpenAqLocationsTtlMs();

    try {
      const data = await this.service.getLocations(params);
      if (isMongoConnected()) {
        const items = openAqLocationsResponseToItems(data);
        await reconcileProxyScope({
          mode,
          source: OPENAQ_LOCATIONS_CACHE_SOURCE,
          scopeKey,
          items,
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenAq getLocations:', message);
      if (isMongoConnected()) {
        const cached = await readScopePayloads(OPENAQ_LOCATIONS_CACHE_SOURCE, scopeKey);
        if (cached.length > 0) {
          res.status(200).json(wrapOpenAqLocationsCacheResponse(cached));
          return;
        }
      }
      res.status(502).json({
        message: 'Não foi possível obter locais OpenAQ.',
        error: message
      });
    }
  }

  async getLocationById(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const scopeKey = buildScopeKey(OPENAQ_LOCATION_BY_ID_SOURCE, { id });
    const mode = resolveOpenAqProxyReconciliationMode();
    const ttlMs = resolveOpenAqProxyTtlMs();

    try {
      const data = await this.service.getLocationById(id);
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: OPENAQ_LOCATION_BY_ID_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenAq getLocationById:', message);
      const cached =
        isMongoConnected() && (await readScopeFirstPayload(OPENAQ_LOCATION_BY_ID_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, OPENAQ_PROXY_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter o local OpenAQ.',
        error: message
      });
    }
  }

  async getLocationLatest(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const scopeKey = buildScopeKey(OPENAQ_LOCATION_LATEST_SOURCE, { id });
    const mode = resolveOpenAqProxyReconciliationMode();
    const ttlMs = resolveOpenAqProxyTtlMs();

    try {
      const data = await this.service.getLocationLatest(id);
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: OPENAQ_LOCATION_LATEST_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenAq getLocationLatest:', message);
      const cached =
        isMongoConnected() && (await readScopeFirstPayload(OPENAQ_LOCATION_LATEST_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, OPENAQ_PROXY_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter medições recentes OpenAQ.',
        error: message
      });
    }
  }

  async getCountries(req: Request, res: Response): Promise<void> {
    const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
    const scopeKey = buildScopeKey(OPENAQ_COUNTRIES_SOURCE, params);
    const mode = resolveOpenAqProxyReconciliationMode();
    const ttlMs = resolveOpenAqProxyTtlMs();

    try {
      const data = await this.service.getCountries(params);
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: OPENAQ_COUNTRIES_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenAq getCountries:', message);
      const cached =
        isMongoConnected() && (await readScopeFirstPayload(OPENAQ_COUNTRIES_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, OPENAQ_PROXY_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter países OpenAQ.',
        error: message
      });
    }
  }

  async getParameters(req: Request, res: Response): Promise<void> {
    const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
    const scopeKey = buildScopeKey(OPENAQ_PARAMETERS_SOURCE, params);
    const mode = resolveOpenAqProxyReconciliationMode();
    const ttlMs = resolveOpenAqProxyTtlMs();

    try {
      const data = await this.service.getParameters(
        Object.keys(params).length > 0 ? params : undefined
      );
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: OPENAQ_PARAMETERS_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenAq getParameters:', message);
      const cached =
        isMongoConnected() && (await readScopeFirstPayload(OPENAQ_PARAMETERS_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, OPENAQ_PROXY_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter parâmetros OpenAQ.',
        error: message
      });
    }
  }
}
