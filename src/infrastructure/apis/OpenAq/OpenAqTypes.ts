/**
 * OpenAQ API v3 — qualidade do ar (estações, medições).
 * v1/v2 retirados (410 Gone). Ver: https://docs.openaq.org/about/about
 */

export const API_CONFIG = {
  BASE_URL: 'https://api.openaq.org/v3'
} as const;

export const HTTP_CONFIG = {
  TIMEOUT_MS: 30_000,
  USER_AGENT: 'BioScan-Backend/1.0 (OpenAQ-v3)',
  API_KEY_HEADER: 'X-API-Key'
} as const;

/** Limite máximo repassado em `limit` (proteção + alinhado a paginação OpenAQ). */
export const QUERY_LIMIT_MAX = 10_000;
