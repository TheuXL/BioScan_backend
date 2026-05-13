import { Request, Response } from 'express';
import { GlobalForestWatchService } from './GlobalForestWatchService';

export class GlobalForestWatchController {
  constructor(private readonly service: GlobalForestWatchService) {}

  /** GET / — descoberta da API (substitui o antigo 501). */
  async getInfo(_req: Request, res: Response): Promise<void> {
    res.json({
      provider: 'Global Forest Watch Data API',
      documentation: 'https://data-api.globalforestwatch.org/',
      terms: 'https://www.globalforestwatch.org/terms',
      basePath: '/api/deforestation',
      endpoints: {
        ping: 'GET /api/deforestation/ping',
        datasets: 'GET /api/deforestation/datasets',
        fields: 'GET /api/deforestation/dataset/:dataset/:version/fields',
        queryJson: 'GET /api/deforestation/dataset/:dataset/:version/query/json?sql=... (&geostore_id opcional)'
      },
      requiresApiKeyFor: ['queryJson'],
      hasApiKeyConfigured: this.service.hasApiKey()
    });
  }

  async getPing(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.getPing();
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('GFW getPing:', message);
      res.status(502).json({ message: 'GFW Data API indisponível.', error: message });
    }
  }

  async getDatasets(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.getDatasets();
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('GFW getDatasets:', message);
      res.status(502).json({ message: 'Não foi possível listar datasets GFW.', error: message });
    }
  }

  async getFields(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.getFields(String(req.params.dataset), String(req.params.version));
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('GFW getFields:', message);
      res.status(502).json({ message: 'Não foi possível obter campos do dataset GFW.', error: message });
    }
  }

  async queryJson(req: Request, res: Response): Promise<void> {
    try {
      if (!this.service.hasApiKey()) {
        res.status(503).json({
          message:
            'Consultas SQL à GFW exigem GFW_API_KEY no .env. Veja https://data-api.globalforestwatch.org/ (Authentication).',
          documentation: 'https://data-api.globalforestwatch.org/'
        });
        return;
      }
      const extra = this.service.parseExpressQuery(req.query as Record<string, unknown>);
      const sql = extra.sql;
      if (!sql) {
        res.status(400).json({ message: 'Query obrigatória: sql' });
        return;
      }
      const { sql: _s, ...rest } = extra;
      const data = await this.service.queryJson(String(req.params.dataset), String(req.params.version), {
        sql,
        geostore_id: rest.geostore_id,
        geostore_origin: rest.geostore_origin
      });
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('GFW queryJson:', message);
      res.status(502).json({ message: 'Consulta GFW falhou.', error: message });
    }
  }
}
