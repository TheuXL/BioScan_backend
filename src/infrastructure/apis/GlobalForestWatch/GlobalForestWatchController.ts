import { Request, Response } from 'express';
import {
  buildScopeKey,
  isMongoConnected,
  readScopeFirstPayload,
  reconcileProxyScope
} from '../../cache/proxyReconciliation';
import { singlePayloadCacheItems, withBioscanCacheMeta } from '../../cache/proxyCacheHelpers';
import { GlobalForestWatchService } from './GlobalForestWatchService';
import {
  GFW_DATASETS_SOURCE,
  GFW_FIELDS_SOURCE,
  GFW_PING_SOURCE,
  GFW_QUERY_JSON_SOURCE,
  resolveGfwProxyReconciliationMode,
  resolveGfwProxyTtlMs
} from './GlobalForestWatchProxyCacheConfig';

const GFW_FALLBACK_NOTE =
  'GFW Data API indisponível — resposta reconstruída a partir do cache BioScan (MongoDB).';

export class GlobalForestWatchController {
  constructor(private readonly service: GlobalForestWatchService) {}

  /** GET / — descoberta da API (substitui o antigo 501). */
  async getInfo(_req: Request, res: Response): Promise<void> {
    res.json({
      provider: 'Global Forest Watch Data API',
      documentation: 'https://data-api.globalforestwatch.org/',
      terms: 'https://www.globalforestwatch.org/terms',
      basePath: '/api/deforestation',
      endpoints: {
        ping: 'GET /api/deforestation/ping',
        datasets: 'GET /api/deforestation/datasets',
        fields: 'GET /api/deforestation/dataset/:dataset/:version/fields',
        queryJson: 'GET /api/deforestation/dataset/:dataset/:version/query/json?sql=... (&geostore_id opcional)'
      },
      requiresApiKeyFor: ['queryJson'],
      hasApiKeyConfigured: this.service.hasApiKey()
    });
  }

  async getPing(_req: Request, res: Response): Promise<void> {
    const scopeKey = buildScopeKey(GFW_PING_SOURCE, {});
    const mode = resolveGfwProxyReconciliationMode();
    const ttlMs = resolveGfwProxyTtlMs();

    try {
      const data = await this.service.getPing();
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: GFW_PING_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('GFW getPing:', message);
      const cached = isMongoConnected() && (await readScopeFirstPayload(GFW_PING_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, GFW_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({ message: 'GFW Data API indisponível.', error: message });
    }
  }

  async getDatasets(_req: Request, res: Response): Promise<void> {
    const scopeKey = buildScopeKey(GFW_DATASETS_SOURCE, {});
    const mode = resolveGfwProxyReconciliationMode();
    const ttlMs = resolveGfwProxyTtlMs();

    try {
      const data = await this.service.getDatasets();
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: GFW_DATASETS_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('GFW getDatasets:', message);
      const cached =
        isMongoConnected() && (await readScopeFirstPayload(GFW_DATASETS_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, GFW_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({ message: 'Não foi possível listar datasets GFW.', error: message });
    }
  }

  async getFields(req: Request, res: Response): Promise<void> {
    const dataset = String(req.params.dataset);
    const version = String(req.params.version);
    const qp = { dataset, version };
    const scopeKey = buildScopeKey(GFW_FIELDS_SOURCE, qp);
    const mode = resolveGfwProxyReconciliationMode();
    const ttlMs = resolveGfwProxyTtlMs();

    try {
      const data = await this.service.getFields(dataset, version);
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: GFW_FIELDS_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('GFW getFields:', message);
      const cached = isMongoConnected() && (await readScopeFirstPayload(GFW_FIELDS_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, GFW_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({
        message: 'Não foi possível obter campos do dataset GFW.',
        error: message
      });
    }
  }

  async queryJson(req: Request, res: Response): Promise<void> {
    if (!this.service.hasApiKey()) {
      res.status(503).json({
        message:
          'Consultas SQL à GFW exigem GFW_API_KEY no .env. Veja https://data-api.globalforestwatch.org/ (Authentication).',
        documentation: 'https://data-api.globalforestwatch.org/'
      });
      return;
    }
    const extra = this.service.parseExpressQuery(req.query as Record<string, unknown>);
    const sql = extra.sql;
    if (!sql) {
      res.status(400).json({ message: 'Query obrigatória: sql' });
      return;
    }
    const { sql: _s, ...rest } = extra;
    const dataset = String(req.params.dataset);
    const version = String(req.params.version);
    const scopeFlat: Record<string, string> = {
      dataset,
      version,
      sql: String(sql)
    };
    for (const [k, rawVal] of Object.entries(rest)) {
      if (rawVal === undefined || rawVal === null) continue;
      scopeFlat[k] = String(rawVal);
    }
    const scopeKey = buildScopeKey(GFW_QUERY_JSON_SOURCE, scopeFlat);
    const mode = resolveGfwProxyReconciliationMode();
    const ttlMs = resolveGfwProxyTtlMs();

    try {
      const data = await this.service.queryJson(dataset, version, {
        sql: String(sql),
        geostore_id: rest.geostore_id ? String(rest.geostore_id) : undefined,
        geostore_origin: rest.geostore_origin ? String(rest.geostore_origin) : undefined
      });
      if (isMongoConnected()) {
        await reconcileProxyScope({
          mode,
          source: GFW_QUERY_JSON_SOURCE,
          scopeKey,
          items: singlePayloadCacheItems(data),
          ttlMs: mode === 'hybrid_ttl' ? ttlMs : undefined
        });
      }
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('GFW queryJson:', message);
      const cached =
        isMongoConnected() && (await readScopeFirstPayload(GFW_QUERY_JSON_SOURCE, scopeKey));
      if (cached !== null && cached !== undefined) {
        res.status(200).json(withBioscanCacheMeta(cached, GFW_FALLBACK_NOTE));
        return;
      }
      res.status(502).json({ message: 'Consulta GFW falhou.', error: message });
    }
  }
}
