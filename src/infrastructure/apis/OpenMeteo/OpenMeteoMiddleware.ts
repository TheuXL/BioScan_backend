import { Request, Response, NextFunction } from 'express';

const LAT_RE = /^-?\d+(\.\d+)?$/;
const LON_RE = /^-?\d+(\.\d+)?$/;

function isValidDateYmd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime());
}

/**
 * Valida latitude e longitude em query (obrigatórios para todos os endpoints deste módulo).
 */
export function validateCoordinates(req: Request, res: Response, next: NextFunction): void {
  const latRaw = req.query.latitude;
  const lonRaw = req.query.longitude;

  if (latRaw === undefined || latRaw === null || latRaw === '') {
    res.status(400).json({ message: 'Query obrigatória: latitude (ex.: -23.55).' });
    return;
  }
  if (lonRaw === undefined || lonRaw === null || lonRaw === '') {
    res.status(400).json({ message: 'Query obrigatória: longitude (ex.: -46.63).' });
    return;
  }

  const latStr = String(latRaw);
  const lonStr = String(lonRaw);

  if (!LAT_RE.test(latStr) || !LON_RE.test(lonStr)) {
    res.status(400).json({ message: 'latitude e longitude devem ser números decimais.' });
    return;
  }

  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lonStr);

  if (latitude < -90 || latitude > 90) {
    res.status(400).json({ message: 'latitude deve estar entre -90 e 90.' });
    return;
  }
  if (longitude < -180 || longitude > 180) {
    res.status(400).json({ message: 'longitude deve estar entre -180 e 180.' });
    return;
  }

  next();
}

/**
 * Para GET /archive — datas obrigatórias no formato Open-Meteo.
 */
export function validateArchiveDates(req: Request, res: Response, next: NextFunction): void {
  const start = req.query.start_date;
  const end = req.query.end_date;

  if (!start || !end) {
    res.status(400).json({
      message: 'Queries obrigatórias: start_date e end_date (formato YYYY-MM-DD).'
    });
    return;
  }

  const startS = String(start);
  const endS = String(end);

  if (!isValidDateYmd(startS) || !isValidDateYmd(endS)) {
    res.status(400).json({ message: 'start_date e end_date devem ser datas válidas (YYYY-MM-DD).' });
    return;
  }

  if (startS > endS) {
    res.status(400).json({ message: 'start_date não pode ser posterior a end_date.' });
    return;
  }

  next();
}
