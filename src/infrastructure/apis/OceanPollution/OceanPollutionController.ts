import { Request, Response } from 'express';
import { OceanPollutionService } from './OceanPollutionService';
import { API_CONFIG, EPA_R9_MARINE_DEBRIS_DATASETS, HTTP_CONFIG } from './OceanPollutionTypes';

export class OceanPollutionController {
  constructor(private readonly service: OceanPollutionService) {}

  /** GET / — descoberta. */
  async getInfo(_req: Request, res: Response): Promise<void> {
    res.json({
      provider: 'BioScan proxy — poluição marinha / lixo (fontes públicas)',
      documentation: 'https://gispub.epa.gov/arcgis/rest/services/R9MarineDebris',
      terms: 'https://www.epa.gov/privacy',
      basePath: '/api/ocean-pollution',
      endpoints: {
        metadata: 'GET /api/ocean-pollution/epa-r9/:dataset/metadata',
        layerGeoJson:
          'GET /api/ocean-pollution/epa-r9/:dataset/layers/:layerId/geojson?where=...&limit|resultRecordCount=...&outFields=...'
      },
      datasets: [...EPA_R9_MARINE_DEBRIS_DATASETS],
      upstreamBase: API_CONFIG.EPA_ARCGIS_BASE,
      requiresApiKey: false
    });
  }

  async getMetadata(req: Request, res: Response): Promise<void> {
    try {
      const dataset = String(req.params.dataset);
      const data = await this.service.getMapServerMetadata(dataset);
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OceanPollution getMetadata:', message);
      res.status(502).json({ message: 'Não foi possível obter metadados EPA (MapServer).', error: message });
    }
  }

  async getLayerGeojson(req: Request, res: Response): Promise<void> {
    try {
      const dataset = String(req.params.dataset);
      const layerId = Number.parseInt(String(req.params.layerId), 10);
      const q = this.service.parseExpressQuery(req.query as Record<string, unknown>);
      const where = q.where;
      const limitStr = q.resultRecordCount ?? q.limit;
      const resultRecordCount = limitStr
        ? Number.parseInt(limitStr, 10)
        : HTTP_CONFIG.DEFAULT_RESULT_RECORD_COUNT;
      const outFields = q.outFields;

      const data = await this.service.queryLayerGeoJson(dataset, layerId, {
        where,
        resultRecordCount,
        outFields
      });
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OceanPollution getLayerGeojson:', message);
      res.status(502).json({ message: 'Consulta EPA (GeoJSON) falhou.', error: message });
    }
  }
}
