import { Request, Response, NextFunction } from 'express';
import { GLIMS_HTTP_CONFIG, GLIMS_LAYER_ALIAS_NAMES } from './GlimsTypes';

const GLIMS_LAYER_RE = /^GLIMS:[A-Za-z0-9_:-]{1,120}$/;

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function validateLayerNameParam(req: Request, res: Response, next: NextFunction): void {
  const layerName = String(req.params.layerName || '').trim();
  const normalized = layerName.toLowerCase();

  if (
    !GLIMS_LAYER_ALIAS_NAMES.includes(normalized as (typeof GLIMS_LAYER_ALIAS_NAMES)[number]) &&
    !GLIMS_LAYER_RE.test(layerName)
  ) {
    res.status(400).json({
      message: 'layerName invalido. Use um alias suportado ou uma camada no formato GLIMS:<nome>.',
      allowed: [...GLIMS_LAYER_ALIAS_NAMES],
      example: 'GLIMS:GLIMS_Glacier_Outlines'
    });
    return;
  }

  next();
}

export function validateGeoJsonQuery(req: Request, res: Response, next: NextFunction): void {
  const q = req.query as Record<string, unknown>;

  if (isPresent(q.width) || isPresent(q.height)) {
    res.status(400).json({
      message: 'width e height nao sao parametros aceitos nesta rota WFS GeoJSON.'
    });
    return;
  }

  if (isPresent(q.bbox)) {
    const parts = String(q.bbox).split(',').map((part) => Number.parseFloat(part.trim()));
    const [minLon, minLat, maxLon, maxLat] = parts;

    if (
      parts.length !== 4 ||
      !parts.every(Number.isFinite) ||
      minLon < -180 ||
      maxLon > 180 ||
      minLat < -90 ||
      maxLat > 90 ||
      minLon > maxLon ||
      minLat > maxLat
    ) {
      res.status(400).json({
        message: 'bbox invalido. Use minLon,minLat,maxLon,maxLat com lon [-180,180], lat [-90,90] e mins <= maxs.'
      });
      return;
    }
  }

  if (isPresent(q.feature_count)) {
    const raw = String(q.feature_count).trim();
    const n = Number.parseInt(raw, 10);
    if (!/^\d+$/.test(raw) || !Number.isInteger(n) || n < 1 || n > GLIMS_HTTP_CONFIG.MAX_FEATURE_COUNT) {
      res.status(400).json({
        message: `feature_count deve ser inteiro entre 1 e ${GLIMS_HTTP_CONFIG.MAX_FEATURE_COUNT}.`
      });
      return;
    }
  }

  if (isPresent(q.srs)) {
    const srs = String(q.srs).trim().toUpperCase();
    if (!GLIMS_HTTP_CONFIG.ALLOWED_SRS.includes(srs as (typeof GLIMS_HTTP_CONFIG.ALLOWED_SRS)[number])) {
      res.status(400).json({
        message: 'srs nao suportado nesta rota.',
        allowed: [...GLIMS_HTTP_CONFIG.ALLOWED_SRS]
      });
      return;
    }
  }

  if (isPresent(q.cql_filter) && String(q.cql_filter).length > GLIMS_HTTP_CONFIG.MAX_CQL_FILTER_LEN) {
    res.status(400).json({
      message: `cql_filter excede ${GLIMS_HTTP_CONFIG.MAX_CQL_FILTER_LEN} caracteres.`
    });
    return;
  }

  next();
}
