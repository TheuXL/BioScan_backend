import { Request, Response } from 'express';
import { NasaGistempService } from './NasaGistempService';
import { GlobalTemperatureModel } from './NasaGistempModels';
import { DEFAULTS, StationType } from './NasaGistempTypes';

/**
 * NASA GISTEMP Controller
 * Handles HTTP requests and responses for NASA GISTEMP endpoints
 */
export class NasaGistempController {
  constructor(private service: NasaGistempService) {}

  /**
   * Get temperature data
   * GET /api/global-temperature
   */
  async getTemperature(req: Request, res: Response): Promise<void> {
    try {
      const { startYear, endYear, stationType, month } = req.query;

      const options = {
        startYear: startYear ? parseInt(startYear as string) : undefined,
        endYear: endYear ? parseInt(endYear as string) : undefined,
        stationType: stationType ? (stationType as StationType) : DEFAULTS.STATION_TYPE,
        month: month ? (month as string) : undefined
      };

      const temperatureData = await this.service.getTemperatureData(options);

      res.json({
        count: temperatureData.length,
        data: temperatureData
      });
    } catch (error: any) {
      console.error('Error in getTemperature:', error.message);
      res.status(500).json({ 
        message: 'Could not fetch temperature data from database.',
        error: error.message 
      });
    }
  }

  /**
   * Get temperature statistics
   * GET /api/global-temperature/stats
   */
  async getTemperatureStats(req: Request, res: Response): Promise<void> {
    try {
      const { stationType } = req.query;
      const type = stationType ? (stationType as StationType) : DEFAULTS.STATION_TYPE;

      const stats = await GlobalTemperatureModel.aggregate([
        { $match: { stationType: type } },
        {
          $group: {
            _id: null,
            minAnomaly: { $min: '$anomaly' },
            maxAnomaly: { $max: '$anomaly' },
            avgAnomaly: { $avg: '$anomaly' },
            minYear: { $min: '$year' },
            maxYear: { $max: '$year' },
            totalRecords: { $sum: 1 }
          }
        }
      ]);

      if (stats.length === 0) {
        res.json({
          message: 'No temperature data available',
          stats: null
        });
        return;
      }

      res.json({
        stationType: type,
        stats: stats[0]
      });
    } catch (error: any) {
      console.error('Error in getTemperatureStats:', error.message);
      res.status(500).json({ 
        message: 'Could not fetch temperature statistics.',
        error: error.message 
      });
    }
  }

  /**
   * Get sync status
   * GET /api/global-temperature/sync-status
   */
  getSyncStatus(_req: Request, res: Response): void {
    try {
      const status = this.service.getSyncStatus();
      res.json(status);
    } catch (error: any) {
      console.error('Error in getSyncStatus:', error.message);
      res.status(500).json({ 
        message: 'Could not fetch sync status.',
        error: error.message 
      });
    }
  }

  /**
   * Trigger manual sync
   * POST /api/global-temperature/sync
   */
  async triggerSync(req: Request, res: Response): Promise<void> {
    try {
      const { stationType } = req.body;
      const type = stationType ? (stationType as StationType) : DEFAULTS.STATION_TYPE;

      const result = await this.service.syncTemperatureData(type);

      res.json({
        message: 'Temperature data sync completed.',
        ...result
      });
    } catch (error: any) {
      console.error('Error in triggerSync:', error.message);
      res.status(500).json({ 
        message: 'Could not sync temperature data.',
        error: error.message 
      });
    }
  }
}
