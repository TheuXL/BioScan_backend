import { Request, Response, NextFunction } from 'express';
import { LIMITS, OFFSET } from './GlobeTypes';
import {
  EPA_R9_MARINE_DEBRIS_DATASETS,
  HTTP_CONFIG as OCEAN_HTTP
} from '../OceanPollution/OceanPollutionTypes';
import { GBIF_IUCN_CATEGORIES } from '../Extinction/ExtinctionTypes';

/** Filtros GBIF (category, bbox) alinhados a `/api/extinction` sem duplicar o validador do `limit` do globo. */
export function validateGlobeThreatFilters(req: Request, res: Response, next: NextFunction): void {
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

export function validateGlobeLimit(req: Request, res: Response, next: NextFunction): void {
  const raw = req.query.limit ?? String(LIMITS.DEFAULT);
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isInteger(n) || n < LIMITS.MIN || n > LIMITS.MAX) {
    res.status(400).json({
      message: `limit deve estar entre ${LIMITS.MIN} e ${LIMITS.MAX}.`
    });
    return;
  }

  const offsetRaw = req.query.offset;
  if (offsetRaw !== undefined && offsetRaw !== null && String(offsetRaw) !== '') {
    const o = Number.parseInt(String(offsetRaw), 10);
    if (!Number.isInteger(o) || o < OFFSET.MIN || o > OFFSET.MAX) {
      res.status(400).json({
        message: `offset deve estar entre ${OFFSET.MIN} e ${OFFSET.MAX}.`
      });
      return;
    }
  }

  next();
}

export function validateGlobeOceanQuery(req: Request, res: Response, next: NextFunction): void {
  const lid = req.query.layerId !== undefined ? String(req.query.layerId) : '1';
  if (!/^\d+$/.test(lid)) {
    res.status(400).json({ message: 'layerId inválido.' });
    return;
  }

  const dataset = req.query.dataset ? String(req.query.dataset) : EPA_R9_MARINE_DEBRIS_DATASETS[0];
  if (!/^[A-Za-z0-9_]+$/.test(dataset) || !(EPA_R9_MARINE_DEBRIS_DATASETS as readonly string[]).includes(dataset)) {
    res.status(400).json({
      message: 'dataset EPA inválido ou não permitido neste proxy.',
      allowed: [...EPA_R9_MARINE_DEBRIS_DATASETS]
    });
    return;
  }

  const rc = req.query.resultRecordCount ?? req.query.paginaTam;
  if (rc !== undefined && rc !== '') {
    const pn = Number.parseInt(String(rc), 10);
    if (!Number.isInteger(pn) || pn < 1 || pn > OCEAN_HTTP.MAX_RESULT_RECORD_COUNT) {
      res.status(400).json({
        message: `resultRecordCount entre 1 e ${OCEAN_HTTP.MAX_RESULT_RECORD_COUNT}.`
      });
      return;
    }
  }

  next();
}
