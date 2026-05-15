import type { ReconciliationMode } from '../../cache/ProxyCacheTypes';
import { parseProxyReconciliationMode, parseProxyTtlMsFromSeconds } from '../../cache/proxyCacheEnv';

export const OCEAN_EPA_METADATA_SOURCE = 'ocean.epa_r9.metadata';
export const OCEAN_EPA_LAYER_GEOJSON_SOURCE = 'ocean.epa_r9.layer_geojson';

/** `OCEAN_POLLUTION_PROXY_RECONCILIATION_MODE`, `OCEAN_POLLUTION_PROXY_TTL_SEC` (default 3600 s). */

export function resolveOceanPollutionProxyReconciliationMode(): ReconciliationMode {
  return parseProxyReconciliationMode(process.env.OCEAN_POLLUTION_PROXY_RECONCILIATION_MODE, 'hybrid_ttl');
}

export function resolveOceanPollutionProxyTtlMs(): number {
  return parseProxyTtlMsFromSeconds(process.env.OCEAN_POLLUTION_PROXY_TTL_SEC, 3600);
}

export const OCEAN_POLLUTION_FALLBACK_NOTE =
  'EPA ArcGIS indisponível — resposta a partir do cache BioScan (MongoDB).';
