import type { ReconciliationMode } from '../../cache/ProxyCacheTypes';
import {
  parseProxyReconciliationMode,
  parseProxyTtlMsFromSeconds
} from '../../cache/proxyCacheEnv';

export const GFW_PING_SOURCE = 'gfw.data_api.ping';

export const GFW_DATASETS_SOURCE = 'gfw.data_api.datasets';

export const GFW_FIELDS_SOURCE = 'gfw.data_api.fields';

export const GFW_QUERY_JSON_SOURCE = 'gfw.data_api.dataset.query_json';

/**
 * `GFW_PROXY_RECONCILIATION_MODE` — ping, datasets, fields, query/json (default `hybrid_ttl`).
 * `GFW_PROXY_TTL_SEC` — default `3600`.
 */

export function resolveGfwProxyReconciliationMode(): ReconciliationMode {
  return parseProxyReconciliationMode(process.env.GFW_PROXY_RECONCILIATION_MODE, 'hybrid_ttl');
}

export function resolveGfwProxyTtlMs(): number {
  return parseProxyTtlMsFromSeconds(process.env.GFW_PROXY_TTL_SEC, 3600);
}
