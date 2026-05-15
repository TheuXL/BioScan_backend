import { Request, Response } from 'express';
import { UsgsEarthquakeService } from './UsgsEarthquakeService';
import { FeedWindow } from './UsgsEarthquakeTypes';

export class UsgsEarthquakeController {
  constructor(private readonly service: UsgsEarthquakeService) {}

  /**
   * GET /api/earthquakes — consulta FDSNWS (GeoJSON).
   */
  async queryEvents(req: Request, res: Response): Promise<void> {
    try {
      const params = this.service.parseExpressQuery(req.query as Record<string, unknown>);
      const data = await this.service.queryEvents(params);
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('UsgsEarthquake queryEvents:', message);
      res.status(502).json({
        message: 'Não foi possível obter sismos (USGS).',
        error: message
      });
    }
  }

  /**
   * GET /api/earthquakes/feed/:window — feed GeoJSON agregado USGS.
   */
  async getFeed(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.getFeed(req.params.window as FeedWindow);
      res.json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('UsgsEarthquake getFeed:', message);
      res.status(502).json({
        message: 'Não foi possível obter feed de sismos (USGS).',
        error: message
      });
    }
  }
}
