import type { ReconciliationMode } from '../../../cache/ProxyCacheTypes';
import { parseProxyReconciliationMode, parseProxyTtlMsFromSeconds } from '../../../cache/proxyCacheEnv';

export const EONET_EVENTS_SOURCE = 'eonet.v21.events';
export const EONET_CATEGORIES_SOURCE = 'eonet.v21.categories';
export const EONET_CATEGORY_EVENTS_SOURCE = 'eonet.v21.category_events';
export const EONET_SOURCES_SOURCE = 'eonet.v21.sources';
export const EONET_LAYERS_SOURCE = 'eonet.v21.layers';
export const EONET_LAYERS_BY_CATEGORY_SOURCE = 'eonet.v21.layers_by_category';

/** `EONET_PROXY_RECONCILIATION_MODE`, `EONET_PROXY_TTL_SEC` (default 1800 s). */

export function resolveEonetProxyReconciliationMode(): ReconciliationMode {
  return parseProxyReconciliationMode(process.env.EONET_PROXY_RECONCILIATION_MODE, 'hybrid_ttl');
}

export function resolveEonetProxyTtlMs(): number {
  return parseProxyTtlMsFromSeconds(process.env.EONET_PROXY_TTL_SEC, 1800);
}

export const EONET_PROXY_FALLBACK_NOTE =
  'NASA EONET indisponível — resposta a partir do cache BioScan (MongoDB).';
