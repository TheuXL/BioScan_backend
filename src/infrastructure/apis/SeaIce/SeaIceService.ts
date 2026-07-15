import axios, { AxiosInstance } from 'axios';
import { SEAICE_API_CONFIG, SEAICE_HTTP_CONFIG, SEAICE_LAYER_ALIASES } from './SeaIceTypes';

export class SeaIceService {
  private readonly client: AxiosInstance;

  constructor(config?: { timeoutMs?: number }) {
    this.client = axios.create({
      timeout: config?.timeoutMs ?? SEAICE_HTTP_CONFIG.TIMEOUT_MS,
      headers: {
        'User-Agent': SEAICE_HTTP_CONFIG.USER_AGENT,
        Accept: 'application/json, application/xml, text/xml, */*'
      }
    });
  }

  async getCapabilities(): Promise<string> {
    const response = await this.client.get<string>(SEAICE_API_CONFIG.WMS_BASE_URL, {
      params: {
        service: 'WMS',
        version: '1.3.0',
        request: 'GetCapabilities'
      },
      responseType: 'text'
    });
    return response.data;
  }

  async getLayerGeoJson(layerName?: string, options?: { bbox?: string; srs?: string; cql_filter?: string; feature_count?: number }): Promise<unknown> {
    const resolvedLayer = this.resolveLayer(layerName);
    const response = await this.client.get<unknown>(SEAICE_API_CONFIG.WMS_BASE_URL, {
      params: {
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: resolvedLayer,
        outputFormat: 'application/json',
        srsName: options?.srs ?? SEAICE_API_CONFIG.DEFAULT_SRS,
        bbox: options?.bbox ?? SEAICE_API_CONFIG.DEFAULT_BBOX,
        cql_filter: options?.cql_filter,
        maxFeatures: options?.feature_count ?? SEAICE_API_CONFIG.DEFAULT_FEATURE_COUNT
      }
    });
    return response.data;
  }

  resolveLayer(layerName?: string): string {
    if (!layerName) return SEAICE_API_CONFIG.DEFAULT_LAYER;
    const normalized = layerName.trim().toLowerCase() as keyof typeof SEAICE_LAYER_ALIASES;
    return SEAICE_LAYER_ALIASES[normalized] || layerName;
  }
}