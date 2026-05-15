import type { ReconciliationMode } from '../../cache/ProxyCacheTypes';
import { parseProxyReconciliationMode, parseProxyTtlMsFromSeconds } from '../../cache/proxyCacheEnv';

/** Demais rotas OpenAQ v3 (não confundir com `OPENAQ_LOCATIONS_*` em `OpenAqLocationsCacheConfig`). */
export const OPENAQ_LOCATION_BY_ID_SOURCE = 'openaq.v3.location_by_id';
export const OPENAQ_LOCATION_LATEST_SOURCE = 'openaq.v3.location_latest';
export const OPENAQ_COUNTRIES_SOURCE = 'openaq.v3.countries';
export const OPENAQ_PARAMETERS_SOURCE = 'openaq.v3.parameters';

/**
 * `OPENAQ_PROXY_RECONCILIATION_MODE`, `OPENAQ_PROXY_TTL_SEC` — aplicados a
 * `/locations/:id`, `/locations/:id/latest`, `/countries`, `/parameters`.
 */
export function resolveOpenAqProxyReconciliationMode(): ReconciliationMode {
  return parseProxyReconciliationMode(process.env.OPENAQ_PROXY_RECONCILIATION_MODE, 'hybrid_ttl');
}

export function resolveOpenAqProxyTtlMs(): number {
  return parseProxyTtlMsFromSeconds(process.env.OPENAQ_PROXY_TTL_SEC, 3600);
}

export const OPENAQ_PROXY_FALLBACK_NOTE =
  'OpenAQ indisponível — resposta a partir do cache BioScan (MongoDB).';
