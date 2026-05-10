import { Request, Response, NextFunction } from 'express';
import { StationType } from './NasaGistempTypes';

/**
 * NASA GISTEMP Middleware
 * Provides validation middleware for NASA GISTEMP API request parameters
 */

/**
 * Validates station type parameter
 */
export function validateStationType(req: Request, res: Response, next: NextFunction): void {
  const { stationType } = req.query;

  if (stationType && !Object.values(StationType).includes(stationType as StationType)) {
    res.status(400).json({
      message: `Invalid station type. Valid types: ${Object.values(StationType).join(', ')}`
    });
    return;
  }

  next();
}

/**
 * Validates year parameters
 */
export function validateYears(req: Request, res: Response, next: NextFunction): void {
  const { startYear, endYear } = req.query;

  if (startYear) {
    const year = parseInt(startYear as string);
    if (isNaN(year) || year < 1880 || year > new Date().getFullYear()) {
      res.status(400).json({
        message: 'Invalid startYear. Must be a number between 1880 and current year.'
      });
      return;
    }
  }

  if (endYear) {
    const year = parseInt(endYear as string);
    if (isNaN(year) || year < 1880 || year > new Date().getFullYear()) {
      res.status(400).json({
        message: 'Invalid endYear. Must be a number between 1880 and current year.'
      });
      return;
    }
  }

  if (startYear && endYear) {
    const start = parseInt(startYear as string);
    const end = parseInt(endYear as string);
    if (start > end) {
      res.status(400).json({
        message: 'startYear must be less than or equal to endYear.'
      });
      return;
    }
  }

  next();
}

/**
 * Validates month parameter
 */
export function validateMonth(req: Request, res: Response, next: NextFunction): void {
  const { month } = req.query;

  if (month) {
    const validMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (!validMonths.includes(month as string)) {
      res.status(400).json({
        message: `Invalid month. Valid months: ${validMonths.join(', ')}`
      });
      return;
    }
  }

  next();
}

/**
 * Validates station type in request body
 */
export function validateStationTypeBody(req: Request, res: Response, next: NextFunction): void {
  const { stationType } = req.body;

  if (stationType && !Object.values(StationType).includes(stationType as StationType)) {
    res.status(400).json({
      message: `Invalid station type. Valid types: ${Object.values(StationType).join(', ')}`
    });
    return;
  }

  next();
}
