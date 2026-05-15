import { Request, Response } from 'express';
import { NasaEonetService } from './NasaEonetService';

export class NasaEonetController {
  constructor(private readonly service: NasaEonetService) {}

  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
      const data = await this.service.getEvents(params);
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('NasaEonet getEvents:', message);
      res.status(502).json({
        message: 'Não foi possível obter eventos naturais (NASA EONET).',
        error: message
      });
    }
  }

  async listCategories(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.getCategories();
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('NasaEonet listCategories:', message);
      res.status(502).json({
        message: 'Não foi possível obter categorias EONET.',
        error: message
      });
    }
  }

  async getCategoryEvents(req: Request, res: Response): Promise<void> {
    try {
      const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
      const data = await this.service.getCategories(String(req.params.categoryId), params);
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('NasaEonet getCategoryEvents:', message);
      res.status(502).json({
        message: 'Não foi possível obter eventos da categoria EONET.',
        error: message
      });
    }
  }

  async listSources(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.getSources();
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('NasaEonet listSources:', message);
      res.status(502).json({
        message: 'Não foi possível obter fontes EONET.',
        error: message
      });
    }
  }

  async listLayers(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.getLayers();
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('NasaEonet listLayers:', message);
      res.status(502).json({
        message: 'Não foi possível obter camadas EONET.',
        error: message
      });
    }
  }

  async getLayersByCategory(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.getLayers(String(req.params.categoryId));
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('NasaEonet getLayersByCategory:', message);
      res.status(502).json({
        message: 'Não foi possível obter camadas EONET da categoria.',
        error: message
      });
    }
  }
}
