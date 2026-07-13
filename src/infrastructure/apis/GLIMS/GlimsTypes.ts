export const GLIMS_API_CONFIG = {
  WMS_CAPABILITIES_URL: 'https://www.glims.org/geoserver/ows',
  WMS_BASE_URL: 'https://www.glims.org/geoserver/ows',
  DEFAULT_LAYER: 'GLIMS:GLIMS_Glacier_Outlines',
  DEFAULT_SRS: 'EPSG:4326',
  DEFAULT_BBOX: '-180,-90,180,90',
  DEFAULT_FEATURE_COUNT: 25
} as const;

export const GLIMS_HTTP_CONFIG = {
  TIMEOUT_MS: 20000,
  USER_AGENT: 'BioScan-Backend/1.0 (GLIMS-WFS-proxy)',
  MAX_FEATURE_COUNT: 1000,
  MAX_CQL_FILTER_LEN: 500,
  ALLOWED_SRS: ['EPSG:4326']
} as const;

export const GLIMS_LAYER_ALIASES = {
  outlines: 'GLIMS:GLIMS_Glacier_Outlines',
  rgi: 'GLIMS:RGI',
  rgi70: 'GLIMS:RGI70',
  extinct: 'GLIMS:extinct_glaciers_view'
} as const;

export const GLIMS_LAYER_ALIAS_NAMES = [
  'outlines',
  'glacier-outlines',
  'rgi',
  'rgi70',
  'extinct',
  'extinct-glaciers'
] as const;
