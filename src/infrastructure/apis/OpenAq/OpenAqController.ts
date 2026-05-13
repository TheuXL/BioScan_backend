import { Request, Response } from 'express';
import { OpenAqService } from './OpenAqService';

export class OpenAqController {
  constructor(private readonly service: OpenAqService) {}

  async getLocations(req: Request, res: Response): Promise<void> {
    try {
      const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
      const data = await this.service.getLocations(params);
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenAq getLocations:', message);
      res.status(502).json({
        message: 'Não foi possível obter locais OpenAQ.',
        error: message
      });
    }
  }

  async getLocationById(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.getLocationById(String(req.params.id));
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenAq getLocationById:', message);
      res.status(502).json({
        message: 'Não foi possível obter o local OpenAQ.',
        error: message
      });
    }
  }

  async getLocationLatest(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.getLocationLatest(String(req.params.id));
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenAq getLocationLatest:', message);
      res.status(502).json({
        message: 'Não foi possível obter medições recentes OpenAQ.',
        error: message
      });
    }
  }

  async getCountries(req: Request, res: Response): Promise<void> {
    try {
      const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
      const data = await this.service.getCountries(params);
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenAq getCountries:', message);
      res.status(502).json({
        message: 'Não foi possível obter países OpenAQ.',
        error: message
      });
    }
  }

  async getParameters(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.getParameters();
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('OpenAq getParameters:', message);
      res.status(502).json({
        message: 'Não foi possível obter parâmetros OpenAQ.',
        error: message
      });
    }
  }
}
