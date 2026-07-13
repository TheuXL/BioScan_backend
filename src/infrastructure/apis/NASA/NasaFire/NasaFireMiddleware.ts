import { Request, Response, NextFunction } from 'express';
import { FireSource, DEFAULTS } from './NasaFireTypes';

/**
 * NASA Fire Middleware
 * Validation and request processing middleware
 */

/**
 * Validates fire source parameter
 */
export const validateSource = (req: Request, res: Response, next: NextFunction): void => {
  const { source } = req.query || req.body;
  
  if (source && !Object.values(FireSource).includes(source as FireSource)) {
    res.status(400).json({
      message: `Invalid source. Valid sources: ${Object.values(FireSource).join(', ')}`
    });
    return;
  }
  
  next();
};

/**
 * Validates days parameter
 */
export const validateDays = (req: Request, res: Response, next: NextFunction): void => {
  const { days } = req.query || req.body;
  
  if (days !== undefined) {
    const daysNum = parseInt(days as string);
    if (isNaN(daysNum) || daysNum < DEFAULTS.MIN_DAYS || daysNum > DEFAULTS.MAX_DAYS) {
      res.status(400).json({
        message: `Days parameter must be a number between ${DEFAULTS.MIN_DAYS} and ${DEFAULTS.MAX_DAYS}.`
      });
      return;
    }
  }
  
  next();
};

/**
 * Validates country code parameter
 */
export const validateCountryCode = (req: Request, res: Response, next: NextFunction): void => {
  const { countryCode } = req.query;
  
  if (countryCode && (countryCode as string).length !== 3) {
    res.status(400).json({
      message: 'Country code must be a 3-letter ISO 3166-1 alpha-3 code (e.g., BRA, USA, CAN).'
    });
    return;
  }
  
  next();
};

/**
 * Validates limit parameter
 */
export const validateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const { limit } = req.query;
  
  if (limit !== undefined) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50000) {
      res.status(400).json({
        message: 'Limit parameter must be a number between 1 and 50000.'
      });
      return;
    }
  }

  const { offset } = req.query;
  if (offset !== undefined && offset !== '') {
    const offsetNum = parseInt(offset as string, 10);
    if (isNaN(offsetNum) || offsetNum < 0) {
      res.status(400).json({
        message: 'offset must be a non-negative integer.'
      });
      return;
    }
  }
  
  next();
};

/**
 * Validates date parameters
 */
export const validateDates = (req: Request, res: Response, next: NextFunction): void => {
  const { startDate, endDate } = req.query;
  
  if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate as string)) {
    res.status(400).json({
      message: 'startDate must be in YYYY-MM-DD format.'
    });
    return;
  }
  
  if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate as string)) {
    res.status(400).json({
      message: 'endDate must be in YYYY-MM-DD format.'
    });
    return;
  }
  
  if (startDate && endDate && startDate > endDate) {
    res.status(400).json({
      message: 'startDate must be before or equal to endDate.'
    });
    return;
  }
  
  next();
};
