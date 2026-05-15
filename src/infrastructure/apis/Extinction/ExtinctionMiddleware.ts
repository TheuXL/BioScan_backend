import { Request, Response, NextFunction } from 'express';
import { GBIF_IUCN_CATEGORIES, SYNC_CONFIG } from './ExtinctionTypes';

export function validateOccurrenceListQuery(req: Request, res: Response, next: NextFunction): void {
  const limitRaw = req.query.limit ?? '100';
  const limit = Number.parseInt(String(limitRaw), 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > SYNC_CONFIG.MAX_QUERY_LIMIT) {
    res.status(400).json({
      message: `Query limit deve ser inteiro entre 1 e ${SYNC_CONFIG.MAX_QUERY_LIMIT}.`
    });
    return;
  }

  const cat = req.query.category;
  if (cat !== undefined && cat !== null && String(cat).trim() !== '') {
    const c = String(cat).trim().toUpperCase();
    if (!GBIF_IUCN_CATEGORIES.includes(c as (typeof GBIF_IUCN_CATEGORIES)[number])) {
      res.status(400).json({
        message: 'category inválida.',
        allowed: [...GBIF_IUCN_CATEGORIES]
      });
      return;
    }
  }

  const nums = ['minLatitude', 'maxLatitude', 'minLongitude', 'maxLongitude'] as const;
  const present = nums.map((k) => req.query[k]).filter((v) => v !== undefined && v !== null && String(v) !== '');
  if (present.length > 0 && present.length !== 4) {
    res.status(400).json({
      message: 'Bounding box: informe os quatro parâmetros minLatitude, maxLatitude, minLongitude, maxLongitude.'
    });
    return;
  }

  if (present.length === 4) {
    const minLat = Number.parseFloat(String(req.query.minLatitude));
    const maxLat = Number.parseFloat(String(req.query.maxLatitude));
    const minLon = Number.parseFloat(String(req.query.minLongitude));
    const maxLon = Number.parseFloat(String(req.query.maxLongitude));
    if (
      ![minLat, maxLat, minLon, maxLon].every(Number.isFinite) ||
      minLat < -90 ||
      maxLat > 90 ||
      minLat > maxLat ||
      minLon < -180 ||
      maxLon > 180 ||
      minLon > maxLon
    ) {
      res.status(400).json({
        message: 'Bounding box inválido (lat [-90,90], lon [-180,180], mins ≤ maxs).'
      });
      return;
    }
  }

  next();
}

export function validateSyncBody(req: Request, res: Response, next: NextFunction): void {
  const body = req.body as Record<string, unknown> | undefined;
  if (!body || typeof body !== 'object') {
    next();
    return;
  }

  if (body.maxRecords !== undefined && body.maxRecords !== null) {
    const n = Number(body.maxRecords);
    if (!Number.isInteger(n) || n < 1 || n > 50_000) {
      res.status(400).json({ message: 'body.maxRecords deve ser inteiro entre 1 e 50000.' });
      return;
    }
  }

  if (body.categories !== undefined && body.categories !== null) {
    const arr = Array.isArray(body.categories) ? body.categories : String(body.categories).split(',');
    const upper = arr.map((x) => String(x).trim().toUpperCase()).filter(Boolean);
    const bad = upper.filter((c) => !GBIF_IUCN_CATEGORIES.includes(c as (typeof GBIF_IUCN_CATEGORIES)[number]));
    if (bad.length > 0) {
      res.status(400).json({
        message: 'body.categories contém valores inválidos.',
        invalid: bad,
        allowed: [...GBIF_IUCN_CATEGORIES]
      });
      return;
    }
  }

  next();
}
