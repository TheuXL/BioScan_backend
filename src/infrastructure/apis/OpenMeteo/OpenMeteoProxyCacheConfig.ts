import type { ReconciliationMode } from '../../cache/ProxyCacheTypes';
import {
  parseProxyReconciliationMode,
  parseProxyTtlMsFromSeconds
} from '../../cache/proxyCacheEnv';

/** Fonte Mongo + namespace de âmbito (query ordenada dentro do hash). */

export const OPENMETEO_FORECAST_SOURCE = 'openmeteo.forecast';

export const OPENMETEO_ARCHIVE_SOURCE = 'openmeteo.archive';

export const OPENMETEO_AIR_QUALITY_SOURCE = 'openmeteo.air_quality';

/**
 * `OPENMETEO_PROXY_RECONCILIATION_MODE` — aplicado aos três endpoints (default `hybrid_ttl`).
 * `OPENMETEO_PROXY_TTL_SEC` — default `1800` (30 min).
 */

export function resolveOpenMeteoProxyReconciliationMode(): ReconciliationMode {
  return parseProxyReconciliationMode(process.env.OPENMETEO_PROXY_RECONCILIATION_MODE, 'hybrid_ttl');
}

export function resolveOpenMeteoProxyTtlMs(): number {
  return parseProxyTtlMsFromSeconds(process.env.OPENMETEO_PROXY_TTL_SEC, 1800);
}
