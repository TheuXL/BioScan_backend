import axios, { AxiosInstance } from 'axios';
import { API_CONFIG, HTTP_CONFIG } from './OceanPollutionTypes';

/**
 * Proxy on-demand para observações de lixo marinho (EPA R9, ArcGIS MapServer).
 * Sem API key; respostas GeoJSON adequadas para camadas no globo.
 */
export class OceanPollutionService {
  private readonly client: AxiosInstance;

  constructor(config?: { timeoutMs?: number }) {
    this.client = axios.create({
      baseURL: API_CONFIG.EPA_ARCGIS_BASE,
      timeout: config?.timeoutMs ?? HTTP_CONFIG.TIMEOUT_MS,
      headers: {
        'User-Agent': HTTP_CONFIG.USER_AGENT,
        Accept: 'application/json, application/geo+json, */*'
      }
    });
  }

  private mapServerBasePath(dataset: string): string {
    return `/rest/services/${API_CONFIG.EPA_R9_FOLDER}/${encodeURIComponent(dataset)}/MapServer`;
  }

  /** Metadados do MapServer (camadas, extensão, etc.). */
  async getMapServerMetadata(dataset: string): Promise<unknown> {
    const path = `${this.mapServerBasePath(dataset)}`;
    const response = await this.client.get<unknown>(path, { params: { f: 'pjson' } });
    if (response.status !== 200 || response.data === undefined) {
      throw new Error(`EPA MapServer metadata failed. HTTP ${response.status}`);
    }
    return response.data;
  }

  /**
   * Query GeoJSON numa camada do MapServer.
   * @param where Cláusula WHERE ArcGIS (ex.: `1=1`).
   */
  async queryLayerGeoJson(
    dataset: string,
    layerId: number,
    options?: {
      where?: string;
      resultRecordCount?: number;
      resultOffset?: number;
      outFields?: string;
    }
  ): Promise<unknown> {
    const path = `${this.mapServerBasePath(dataset)}/${layerId}/query`;
    const where = options?.where?.trim() || '1=1';
    const resultRecordCount =
      options?.resultRecordCount ?? HTTP_CONFIG.DEFAULT_RESULT_RECORD_COUNT;
    const outFields = options?.outFields?.trim() || '*';
    const resultOffset = options?.resultOffset ?? 0;

    const response = await this.client.get<unknown>(path, {
      params: {
        where,
        returnGeometry: 'true',
        outFields,
        f: 'geojson',
        resultRecordCount,
        ...(resultOffset > 0 ? { resultOffset } : {})
      }
    });
    if (response.status !== 200 || response.data === undefined) {
      throw new Error(`EPA layer query failed. HTTP ${response.status}`);
    }
    return response.data;
  }

  parseExpressQuery(query: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, raw] of Object.entries(query)) {
      if (raw === undefined || raw === null) continue;
      out[k] = Array.isArray(raw) ? raw.map(String).join(',') : String(raw);
    }
    return out;
  }
}
