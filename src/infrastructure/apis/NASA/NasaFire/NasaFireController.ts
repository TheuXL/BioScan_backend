import { Request, Response } from 'express';
import { NasaFireService } from './NasaFireService';
import { NasaFireModel } from './NasaFireModels';
import { DEFAULTS, FireSource } from './NasaFireTypes';

/**
 * NASA Fire Controller
 * Handles HTTP requests and responses for NASA Fire endpoints
 */
export class NasaFireController {
  constructor(private service: NasaFireService) {}

  /**
   * Get fires from MongoDB (real-time data from sync service)
   * GET /api/fires
   */
  async getFires(req: Request, res: Response): Promise<void> {
    try {
      const { limit = DEFAULTS.LIMIT, source, startDate, endDate, offset = '0' } = req.query;
      const limitN = parseInt(limit as string, 10);
      const offsetN = parseInt(String(offset), 10) || 0;
      
      const query: any = {};
      if (source) query.source = source;
      if (startDate || endDate) {
        query.acq_date = {};
        if (startDate) query.acq_date.$gte = startDate;
        if (endDate) query.acq_date.$lte = endDate;
      }

      const totalMatching = await NasaFireModel.countDocuments(query);
      const fires = await NasaFireModel.find(query)
        .sort({ acq_date: -1, acq_time: -1 })
        .skip(offsetN)
        .limit(limitN)
        .lean();

      res.json({
        count: fires.length,
        totalMatching,
        offset: offsetN,
        limit: limitN,
        hasMore: offsetN + fires.length < totalMatching,
        data: fires
      });
    } catch (error: any) {
      console.error('Error in getFires:', error.message);
      res.status(500).json({ 
        message: 'Could not fetch fire data from database.',
        error: error.message 
      });
    }
  }

  /**
   * Get fires by country
   * GET /api/fires/by-country
   */
  async getFiresByCountry(req: Request, res: Response): Promise<void> {
    try {
      const { countryCode, source = DEFAULTS.SOURCE, days = DEFAULTS.DAYS } = req.query;
      
      if (!countryCode) {
        res.status(400).json({ 
          message: 'Country code parameter is required (ISO 3166-1 alpha-3, e.g., BRA, USA).' 
        });
        return;
      }

      const firesData = await this.service.getActiveFiresByCountry({ 
        countryCode: countryCode as string, 
        source: source as FireSource, 
        days: parseInt(days as string) 
      });
      
      res.json({
        count: firesData.length,
        data: firesData
      });
    } catch (error: any) {
      console.error('Error in getFiresByCountry:', error.message);
      res.status(500).json({ 
        message: 'Could not fetch fire data by country.',
        error: error.message 
      });
    }
  }

  /**
   * Get fire sync service status
   * GET /api/fires/sync-status
   */
  getSyncStatus(_req: Request, res: Response): void {
    try {
      const status = this.service.getSyncStatus();
      res.json(status);
    } catch (error: any) {
      console.error('Error getting sync status:', error.message);
      res.status(500).json({ 
        message: 'Could not get sync service status.',
        error: error.message 
      });
    }
  }

  /**
   * Manual sync trigger (for testing)
   * POST /api/fires/sync
   */
  async triggerSync(req: Request, res: Response): Promise<void> {
    try {
      const { source = DEFAULTS.SOURCE } = req.body;
      const result = await this.service.syncFireData(source as FireSource);
      
      res.json({
        message: 'Sync completed',
        ...result
      });
    } catch (error: any) {
      console.error('Error in triggerSync:', error.message);
      res.status(500).json({ 
        message: 'Manual sync failed.',
        error: error.message 
      });
    }
  }
}
