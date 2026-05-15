import type { ReconciliationMode } from '../../cache/ProxyCacheTypes';
import {
  parseProxyReconciliationMode,
  parseProxyTtlMsFromSeconds
} from '../../cache/proxyCacheEnv';

export const USGS_EARTHQUAKE_QUERY_SOURCE = 'usgs.earthquake.query';

export const USGS_EARTHQUAKE_FEED_SOURCE = 'usgs.earthquake.feed';

/**
 * `USGS_PROXY_RECONCILIATION_MODE` — `GET /api/earthquakes` e `GET .../feed/:window` (default `hybrid_ttl`).
 * `USGS_PROXY_TTL_SEC` — default `900` (15 min).
 */

export function resolveUsgsProxyReconciliationMode(): ReconciliationMode {
  return parseProxyReconciliationMode(process.env.USGS_PROXY_RECONCILIATION_MODE, 'hybrid_ttl');
}

export function resolveUsgsProxyTtlMs(): number {
  return parseProxyTtlMsFromSeconds(process.env.USGS_PROXY_TTL_SEC, 900);
}
