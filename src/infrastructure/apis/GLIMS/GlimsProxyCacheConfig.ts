import type { ReconciliationMode } from '../../cache/ProxyCacheTypes';
import { parseProxyReconciliationMode, parseProxyTtlMsFromSeconds } from '../../cache/proxyCacheEnv';

export const GLIMS_CAPABILITIES_SOURCE = 'glims.capabilities';
export const GLIMS_LAYER_GEOJSON_SOURCE = 'glims.layer_geojson';

/** `GLIMS_PROXY_RECONCILIATION_MODE`, `GLIMS_PROXY_TTL_SEC` (default 3600 s). */

export function resolveGlimsProxyReconciliationMode(): ReconciliationMode {
  return parseProxyReconciliationMode(process.env.GLIMS_PROXY_RECONCILIATION_MODE, 'hybrid_ttl');
}

export function resolveGlimsProxyTtlMs(): number {
  return parseProxyTtlMsFromSeconds(process.env.GLIMS_PROXY_TTL_SEC, 3600);
}

export const GLIMS_PROXY_FALLBACK_NOTE =
  'GLIMS upstream indisponivel — resposta a partir do cache BioScan (MongoDB).';
