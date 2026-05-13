import { Request, Response, NextFunction } from 'express';
import { EPA_R9_MARINE_DEBRIS_DATASETS, HTTP_CONFIG } from './OceanPollutionTypes';

const DATASET_RE = /^[A-Za-z0-9_]+$/;

export function validateDatasetParam(req: Request, res: Response, next: NextFunction): void {
  const dataset = String(req.params.dataset || '');
  if (!DATASET_RE.test(dataset) || dataset.length > 120) {
    res.status(400).json({ message: 'Parâmetro dataset inválido.' });
    return;
  }
  if (!EPA_R9_MARINE_DEBRIS_DATASETS.includes(dataset as (typeof EPA_R9_MARINE_DEBRIS_DATASETS)[number])) {
    res.status(400).json({
      message: 'Dataset não suportado neste proxy.',
      allowed: [...EPA_R9_MARINE_DEBRIS_DATASETS]
    });
    return;
  }
  next();
}

export function validateLayerIdParam(req: Request, res: Response, next: NextFunction): void {
  const raw = String(req.params.layerId ?? '').trim();
  if (!/^\d+$/.test(raw)) {
    res.status(400).json({ message: 'layerId deve ser um número inteiro (ex.: 1).' });
    return;
  }
  const id = Number.parseInt(raw, 10);
  if (id < 0 || id > 99) {
    res.status(400).json({ message: 'layerId deve estar entre 0 e 99.' });
    return;
  }
  next();
}

export function validateQueryOptions(req: Request, res: Response, next: NextFunction): void {
  const q = req.query as Record<string, unknown>;
  const whereRaw = q.where;
  if (whereRaw !== undefined && whereRaw !== null && String(whereRaw).length > HTTP_CONFIG.MAX_WHERE_LEN) {
    res.status(400).json({ message: `where excede ${HTTP_CONFIG.MAX_WHERE_LEN} caracteres.` });
    return;
  }
  const limitRaw = q.resultRecordCount ?? q.limit;
  if (limitRaw !== undefined && limitRaw !== null && limitRaw !== '') {
    const n = Number.parseInt(String(limitRaw), 10);
    if (!Number.isInteger(n) || n < 1 || n > HTTP_CONFIG.MAX_RESULT_RECORD_COUNT) {
      res.status(400).json({
        message: `resultRecordCount ou limit deve ser inteiro entre 1 e ${HTTP_CONFIG.MAX_RESULT_RECORD_COUNT}.`
      });
      return;
    }
  }
  const outFields = q.outFields;
  if (outFields !== undefined && outFields !== null && String(outFields).length > 500) {
    res.status(400).json({ message: 'outFields demasiado longo.' });
    return;
  }
  next();
}
