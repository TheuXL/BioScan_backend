import type { ProxyCacheItem, ReconciliationMode } from '../../cache/ProxyCacheTypes';
import { parseProxyReconciliationMode, parseProxyTtlMsFromSeconds } from '../../cache/proxyCacheEnv';

/** Identificador lógico da fonte no Mongo (namespace + recurso). */
export const OPENAQ_LOCATIONS_CACHE_SOURCE = 'openaq.v3.locations';

/**
 * `OPENAQ_LOCATIONS_RECONCILIATION_MODE`: `delta` | `snapshot` | `hybrid_ttl` (default `hybrid_ttl`).
 * `OPENAQ_LOCATIONS_TTL_SEC`: TTL em segundos para `hybrid_ttl` (default `3600`).
 */
export function resolveOpenAqLocationsReconciliationMode(): ReconciliationMode {
  return parseProxyReconciliationMode(process.env.OPENAQ_LOCATIONS_RECONCILIATION_MODE, 'hybrid_ttl');
}

export function resolveOpenAqLocationsTtlMs(): number {
  return parseProxyTtlMsFromSeconds(process.env.OPENAQ_LOCATIONS_TTL_SEC, 3600);
}

/** Extrai itens cacheáveis da resposta JSON de `GET /locations` (OpenAQ v3). */
export function openAqLocationsResponseToItems(data: unknown): ProxyCacheItem[] {
  if (!data || typeof data !== 'object') {
    return [];
  }
  const results = (data as { results?: unknown }).results;
  if (!Array.isArray(results)) {
    return [];
  }
  const out: ProxyCacheItem[] = [];
  for (const row of results) {
    if (row === null || typeof row !== 'object') {
      continue;
    }
    const id = (row as { id?: unknown }).id;
    const resourceKey = id !== undefined && id !== null ? String(id) : stableResourceKeyFallback(row);
    out.push({ resourceKey, payload: row });
  }
  return out;
}

function stableResourceKeyFallback(row: object): string {
  try {
    return JSON.stringify(row);
  } catch {
    return `anon_${payloadHashShort(row)}`;
  }
}

function payloadHashShort(row: object): string {
  const s = JSON.stringify(row);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

/** Reconstrói um corpo semelhante ao OpenAQ para fallback a partir dos payloads guardados. */
export function wrapOpenAqLocationsCacheResponse(results: unknown[]): Record<string, unknown> {
  return {
    results,
    meta: {
      fromBioScanCache: true,
      note: 'Resposta reconstruída a partir do cache MongoDB (upstream indisponível ou erro).'
    }
  };
}
