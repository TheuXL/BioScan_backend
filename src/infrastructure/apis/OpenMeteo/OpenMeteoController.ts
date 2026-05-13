import { Request, Response } from 'express';
import { OpenMeteoService } from './OpenMeteoService';

export class OpenMeteoController {
  constructor(private readonly service: OpenMeteoService) {}

  /**
   * GET /api/meteo/forecast — previsão e tempo atual.
   */
  async getForecast(req: Request, res: Response): Promise<void> {
    try {
      const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
      const data = await this.service.getForecast(params);
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenMeteo getForecast:', message);
      res.status(502).json({
        message: 'Não foi possível obter dados meteorológicos (Open-Meteo).',
        error: message
      });
    }
  }

  /**
   * GET /api/meteo/archive — série histórica (arquivo).
   */
  async getArchive(req: Request, res: Response): Promise<void> {
    try {
      const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
      const data = await this.service.getArchive(params);
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenMeteo getArchive:', message);
      res.status(502).json({
        message: 'Não foi possível obter dados históricos (Open-Meteo Archive).',
        error: message
      });
    }
  }

  /**
   * GET /api/meteo/air-quality — qualidade do ar (API dedicada Open-Meteo).
   */
  async getAirQuality(req: Request, res: Response): Promise<void> {
    try {
      const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
      const data = await this.service.getAirQuality(params);
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenMeteo getAirQuality:', message);
      res.status(502).json({
        message: 'Não foi possível obter qualidade do ar (Open-Meteo).',
        error: message
      });
    }
  }
}
