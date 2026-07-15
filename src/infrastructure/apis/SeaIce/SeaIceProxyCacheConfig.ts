import type { ReconciliationMode } from '../../cache/ProxyCacheTypes';
import { parseProxyReconciliationMode, parseProxyTtlMsFromSeconds } from '../../cache/proxyCacheEnv';

export const SEAICE_CAPABILITIES_SOURCE = 'seaice.capabilities';
export const SEAICE_LAYER_GEOJSON_SOURCE = 'seaice.layer_geojson';

export function resolveSeaIceProxyReconciliationMode(): ReconciliationMode {
  return parseProxyReconciliationMode(process.env.SEAICE_PROXY_RECONCILIATION_MODE, 'hybrid_ttl');
}

export function resolveSeaIceProxyTtlMs(): number {
  return parseProxyTtlMsFromSeconds(process.env.SEAICE_PROXY_TTL_SEC, 86400); // 24h default (gelo diário)
}

export const SEAICE_PROXY_FALLBACK_NOTE =
  'NSIDC upstream indisponível — resposta a partir do cache BioScan (SeaIce).';