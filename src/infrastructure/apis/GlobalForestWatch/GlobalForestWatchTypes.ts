/**
 * Global Forest Watch — Data API v0.3
 * @see https://data-api.globalforestwatch.org/
 * @see https://www.globalforestwatch.org/help/developers/
 */

export const API_CONFIG = {
  BASE_URL: 'https://data-api.globalforestwatch.org'
} as const;

export const HTTP_CONFIG = {
  TIMEOUT_MS: 120_000,
  USER_AGENT: 'BioScan-Backend/1.0 (GFW-Data-API)',
  /** Cabeçalho exigido para consultas SQL (`/query/json`). */
  API_KEY_HEADER: 'x-api-key'
} as const;

/** Exemplo de dataset de alertas integrados (versão muda; usar `latest` na API). */
export const EXAMPLE_INTEGRATED_ALERTS_DATASET = 'gfw_integrated_alerts' as const;

/**
 * Dataset vetorial para smoke tests de `query/json` (consulta SQL sem `geostore_id`).
 * Os alertas integrados (`gfw_integrated_alerts`) são raster e exigem geometria na GFW.
 */
export const VECTOR_QUERY_SMOKE_DATASET = 'gadm_adm0_africa' as const;
