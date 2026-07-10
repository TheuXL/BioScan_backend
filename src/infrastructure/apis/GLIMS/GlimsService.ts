import axios, { AxiosInstance } from 'axios';
import { GLIMS_API_CONFIG, GLIMS_HTTP_CONFIG, GLIMS_LAYER_ALIASES } from './GlimsTypes';

export class GlimsService {
  private readonly client: AxiosInstance;

  constructor(config?: { timeoutMs?: number }) {
    this.client = axios.create({
      timeout: config?.timeoutMs ?? GLIMS_HTTP_CONFIG.TIMEOUT_MS,
      headers: {
        'User-Agent': GLIMS_HTTP_CONFIG.USER_AGENT,
        Accept: 'application/json, application/xml, text/xml, */*'
      }
    });
  }

  async getCapabilities(): Promise<unknown> {
    const response = await this.client.get<unknown>(GLIMS_API_CONFIG.WMS_CAPABILITIES_URL, {
      params: {
        service: 'WMS',
        version: '1.3.0',
        request: 'GetCapabilities'
      }
    });

    if (response.status !== 200 || response.data === undefined) {
      throw new Error(`GLIMS capabilities failed. HTTP ${response.status}`);
    }

    return response.data;
  }

  async getLayerGeoJson(layerName?: string, options?: { bbox?: string; width?: number; height?: number; srs?: string; cql_filter?: string; feature_count?: number }): Promise<unknown> {
    const resolvedLayer = this.resolveLayer(layerName);
    const response = await this.client.get<unknown>(GLIMS_API_CONFIG.WMS_BASE_URL, {
      params: {
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: resolvedLayer,
        outputFormat: 'application/json',
        srsName: options?.srs ?? GLIMS_API_CONFIG.DEFAULT_SRS,
        bbox: options?.bbox ?? GLIMS_API_CONFIG.DEFAULT_BBOX,
        width: options?.width ?? GLIMS_API_CONFIG.DEFAULT_WIDTH,
        height: options?.height ?? GLIMS_API_CONFIG.DEFAULT_HEIGHT,
        cql_filter: options?.cql_filter,
        maxFeatures: options?.feature_count
      }
    });

    if (response.status !== 200 || response.data === undefined) {
      throw new Error(`GLIMS layer query failed. HTTP ${response.status}`);
    }

    return response.data;
  }

  resolveLayer(layerName?: string): string {
    if (!layerName) return GLIMS_API_CONFIG.DEFAULT_LAYER;
    const normalized = layerName.trim().toLowerCase();
    switch (normalized) {
      case 'outlines':
      case 'glacier-outlines':
        return GLIMS_LAYER_ALIASES.outlines;
      case 'rgi':
        return GLIMS_LAYER_ALIASES.rgi;
      case 'rgi70':
        return GLIMS_LAYER_ALIASES.rgi70;
      case 'extinct':
      case 'extinct-glaciers':
        return GLIMS_LAYER_ALIASES.extinct;
      default:
        return layerName;
    }
  }
}
