export const GLIMS_API_CONFIG = {
  WMS_CAPABILITIES_URL: 'https://www.glims.org/geoserver/ows',
  WMS_BASE_URL: 'https://www.glims.org/geoserver/ows',
  DEFAULT_LAYER: 'GLIMS:GLIMS_Glacier_Outlines',
  DEFAULT_SRS: 'EPSG:4326',
  DEFAULT_WIDTH: 1024,
  DEFAULT_HEIGHT: 1024,
  DEFAULT_BBOX: '-180,-90,180,90'
} as const;

export const GLIMS_HTTP_CONFIG = {
  TIMEOUT_MS: 20000,
  USER_AGENT: 'BioScan-Backend/1.0 (+https://github.com/...)'
} as const;

export const GLIMS_LAYER_ALIASES = {
  outlines: 'GLIMS:GLIMS_Glacier_Outlines',
  rgi: 'GLIMS:RGI',
  rgi70: 'GLIMS:RGI70',
  extinct: 'GLIMS:extinct_glaciers_view'
} as const;
