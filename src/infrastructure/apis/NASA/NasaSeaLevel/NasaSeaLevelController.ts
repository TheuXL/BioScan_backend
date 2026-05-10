import { Request, Response } from 'express';
import { NasaSeaLevelService } from './NasaSeaLevelService';

export class NasaSeaLevelController {
  constructor(private service: NasaSeaLevelService) {}

  /**
   * GET /api/ice-melt — live fetch from Climate Tools (same behaviour as legacy route).
   */
  async getSeaLevelLive(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.service.fetchGlobalSeaLevel();
      res.status(200).json(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error in getSeaLevelLive:', message);
      res.status(500).json({
        message: 'Could not fetch sea level data.',
        error: message
      });
    }
  }

  /**
   * GET /api/ice-melt/latest — last snapshot stored in MongoDB.
   */
  async getSeaLevelLatest(_req: Request, res: Response): Promise<void> {
    try {
      const latest = await this.service.getLatestSnapshotFromDb();
      if (!latest) {
        res.status(404).json({
          message: 'No sea level snapshot in database. Run POST /api/ice-melt/sync first.'
        });
        return;
      }
      res.status(200).json(latest);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error in getSeaLevelLatest:', message);
      res.status(500).json({
        message: 'Could not read sea level snapshot from database.',
        error: message
      });
    }
  }

  getSyncStatus(_req: Request, res: Response): void {
    try {
      res.status(200).json(this.service.getSyncStatus());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        message: 'Could not get sync status.',
        error: message
      });
    }
  }

  async triggerSync(_req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.syncSeaLevelData();
      res.status(200).json({
        message: 'Sea level sync completed.',
        ...result
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error in triggerSync (sea level):', message);
      res.status(500).json({
        message: 'Could not sync sea level data.',
        error: message
      });
    }
  }
}
