import { Request, Response } from 'express';
import {
  buildScopeKey,
  isMongoConnected,
  readScopeFirstPayload,
  reconcileProxyScope
} from '../../../cache/proxyReconciliation';
import { singlePayloadCacheItems, withBioscanCacheMeta } from '../../../cache/proxyCacheHelpers';
import { NasaEonetService } from './NasaEonetService';
import {
  EONET_CATEGORY_EVENTS_SOURCE,
  EONET_CATEGORIES_SOURCE,
  EONET_EVENTS_SOURCE,
  EONET_LAYERS_BY_CATEGORY_SOURCE,
  EONET_LAYERS_SOURCE,
  EONET_PROXY_FALLBACK_NOTE,
  EONET_SOURCES_SOURCE,
  resolveEonetProxyReconciliationMode,
  resolveEonetProxyTtlMs
} from './NasaEonetProxyCacheConfig';

export class NasaEonetController {
  constructor(private readonly service: NasaEonetService) {}

  async getEvents(req: Request, res: Response): Promise<void> {
    const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
    const scopeKey = buildScopeKey(EONET_EVENTS_SOURCE, params);
    const mode = resolveEonetProxyReconciliationMode();
    const ttlMs = resolveEonetProxyTtlMs();

    try {
      const data = await this.service.getEvents(params);
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: EONET_EVENTS_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('NasaEonet getEvents:', message);
      const cached = isMongoConnected() && (await readScopeFirstPayload(EONET_EVENTS_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, EONET_PROXY_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter eventos naturais (NASA EONET).',
        error: message
      });
    }
  }

  async listCategories(_req: Request, res: Response): Promise<void> {
    const scopeKey = buildScopeKey(EONET_CATEGORIES_SOURCE, {});
    const mode = resolveEonetProxyReconciliationMode();
    const ttlMs = resolveEonetProxyTtlMs();

    try {
      const data = await this.service.getCategories();
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: EONET_CATEGORIES_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('NasaEonet listCategories:', message);
      const cached = isMongoConnected() && (await readScopeFirstPayload(EONET_CATEGORIES_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, EONET_PROXY_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter categorias EONET.',
        error: message
      });
    }
  }

  async getCategoryEvents(req: Request, res: Response): Promise<void> {
    const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
    const categoryId = String(req.params.categoryId);
    const scopeFlat: Record<string, string> = { categoryId, ...params };
    const scopeKey = buildScopeKey(EONET_CATEGORY_EVENTS_SOURCE, scopeFlat);
    const mode = resolveEonetProxyReconciliationMode();
    const ttlMs = resolveEonetProxyTtlMs();

    try {
      const data = await this.service.getCategories(categoryId, params);
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: EONET_CATEGORY_EVENTS_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('NasaEonet getCategoryEvents:', message);
      const cached =
        isMongoConnected() && (await readScopeFirstPayload(EONET_CATEGORY_EVENTS_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, EONET_PROXY_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter eventos da categoria EONET.',
        error: message
      });
    }
  }

  async listSources(_req: Request, res: Response): Promise<void> {
    const scopeKey = buildScopeKey(EONET_SOURCES_SOURCE, {});
    const mode = resolveEonetProxyReconciliationMode();
    const ttlMs = resolveEonetProxyTtlMs();

    try {
      const data = await this.service.getSources();
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: EONET_SOURCES_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('NasaEonet listSources:', message);
      const cached = isMongoConnected() && (await readScopeFirstPayload(EONET_SOURCES_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, EONET_PROXY_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter fontes EONET.',
        error: message
      });
    }
  }

  async listLayers(_req: Request, res: Response): Promise<void> {
    const scopeKey = buildScopeKey(EONET_LAYERS_SOURCE, {});
    const mode = resolveEonetProxyReconciliationMode();
    const ttlMs = resolveEonetProxyTtlMs();

    try {
      const data = await this.service.getLayers();
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: EONET_LAYERS_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('NasaEonet listLayers:', message);
      const cached = isMongoConnected() && (await readScopeFirstPayload(EONET_LAYERS_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, EONET_PROXY_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter camadas EONET.',
        error: message
      });
    }
  }

  async getLayersByCategory(req: Request, res: Response): Promise<void> {
    const categoryId = String(req.params.categoryId);
    const scopeKey = buildScopeKey(EONET_LAYERS_BY_CATEGORY_SOURCE, { categoryId });
    const mode = resolveEonetProxyReconciliationMode();
    const ttlMs = resolveEonetProxyTtlMs();

    try {
      const data = await this.service.getLayers(categoryId);
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: EONET_LAYERS_BY_CATEGORY_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('NasaEonet getLayersByCategory:', message);
      const cached =
        isMongoConnected() && (await readScopeFirstPayload(EONET_LAYERS_BY_CATEGORY_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, EONET_PROXY_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter camadas EONET da categoria.',
        error: message
      });
    }
  }
}
