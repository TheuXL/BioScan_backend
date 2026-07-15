import { Request, Response, NextFunction } from 'express';
import { SEAICE_HTTP_CONFIG, SEAICE_LAYER_ALIAS_NAMES } from './SeaIceTypes';

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function validateSeaIceLayerName(req: Request, res: Response, next: NextFunction): void {
  const layerName = String(req.params.layerName || '').trim().toLowerCase();

  if (!SEAICE_LAYER_ALIAS_NAMES.includes(layerName as any)) {
    res.status(400).json({
      message: 'layerName invalido para SeaIce.',
      allowed: [...SEAICE_LAYER_ALIAS_NAMES]
    });
    return;
  }
  next();
}

export function validateSeaIceQuery(req: Request, res: Response, next: NextFunction): void {
  const q = req.query as Record<string, unknown>;

  if (isPresent(q.bbox)) {
    const parts = String(q.bbox).split(',').map((part) => Number.parseFloat(part.trim()));
    const [minLon, minLat, maxLon, maxLat] = parts;

    if (
      parts.length !== 4 ||
      !parts.every(Number.isFinite) ||
      minLon < -180 || maxLon > 180 ||
      minLat < -90 || maxLat > 90 ||
      minLon > maxLon || minLat > maxLat
    ) {
      res.status(400).json({
        message: 'bbox invalido. Use minLon,minLat,maxLon,maxLat com lon [-180,180] e lat [-90,90].'
      });
      return;
    }
  }

  if (isPresent(q.feature_count)) {
    const n = Number.parseInt(String(q.feature_count), 10);
    if (isNaN(n) || n < 1 || n > SEAICE_HTTP_CONFIG.MAX_FEATURE_COUNT) {
      res.status(400).json({
        message: `feature_count deve estar entre 1 e ${SEAICE_HTTP_CONFIG.MAX_FEATURE_COUNT}.`
      });
      return;
    }
  }

  next();
}