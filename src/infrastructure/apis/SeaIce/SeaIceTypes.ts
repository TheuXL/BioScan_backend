export const SEAICE_API_CONFIG = {
    // NSIDC Atlas of the Cryosphere GeoServer
    WMS_BASE_URL: 'https://nsidc.org/cgi-bin/atlas_north',
    WMS_CAPABILITIES_URL: 'https://nsidc.org/cgi-bin/atlas_north?service=WMS&version=1.3.0&request=GetCapabilities',
    DEFAULT_LAYER: 'NSIDC:sea_ice_index_north_extent_polygons', // Camada de extensão diária
    DEFAULT_SRS: 'EPSG:4326',
    DEFAULT_BBOX: '-180,60,180,90', // Foco padrão no Ártico
    DEFAULT_FEATURE_COUNT: 50
  } as const;
  
  export const SEAICE_HTTP_CONFIG = {
    TIMEOUT_MS: 25000,
    USER_AGENT: 'BioScan-Backend/1.0 (SeaIce-WFS-proxy)',
    MAX_FEATURE_COUNT: 2000,
    MAX_CQL_FILTER_LEN: 600,
    ALLOWED_SRS: ['EPSG:4326']
  } as const;
  
  export const SEAICE_LAYER_ALIASES = {
    'extent-north': 'NSIDC:sea_ice_index_north_extent_polygons',
    'extent-south': 'NSIDC:sea_ice_index_south_extent_polygons',
    'concentration': 'NSIDC:sea_ice_index_north_daily_concentration',
    'masie': 'NSIDC:masie_4km_sea_ice_extent',
    'snow-cover': 'NSIDC:ims_daily_snow_ice_190km'
  } as const;
  
  export const SEAICE_LAYER_ALIAS_NAMES = Object.keys(SEAICE_LAYER_ALIASES) as Array<keyof typeof SEAICE_LAYER_ALIASES>;