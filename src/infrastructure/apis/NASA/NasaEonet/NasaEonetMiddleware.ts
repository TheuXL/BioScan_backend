import { Request, Response, NextFunction } from 'express';
import { EVENT_STATUS } from './NasaEonetTypes';

const POSITIVE_INT_RE = /^[1-9]\d*$/;

function parsePositiveInt(raw: unknown, label: string): string | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const s = String(raw);
  if (!POSITIVE_INT_RE.test(s)) {
    return `Query inválida: ${label} deve ser inteiro positivo.`;
  }
  return null;
}

/** Valida query comum a /events e /categories/:id (status, limit, days, source). */
export function validateEventListQuery(req: Request, res: Response, next: NextFunction): void {
  const q = req.query;

  if (q.status !== undefined && q.status !== '') {
    const status = String(q.status);
    if (!EVENT_STATUS.includes(status as (typeof EVENT_STATUS)[number])) {
      res.status(400).json({ message: 'status deve ser open ou closed.' });
      return;
    }
  }

  for (const key of ['limit', 'days'] as const) {
    const err = parsePositiveInt(q[key], key);
    if (err) {
      res.status(400).json({ message: err });
      return;
    }
  }

  next();
}

export function validateCategoryIdParam(req: Request, res: Response, next: NextFunction): void {
  const id = String(req.params.categoryId || '');
  if (!/^\d+$/.test(id)) {
    res.status(400).json({ message: 'categoryId deve ser numérico (id EONET).' });
    return;
  }
  next();
}

export function validateLayerCategoryIdParam(req: Request, res: Response, next: NextFunction): void {
  const id = String(req.params.categoryId || '');
  if (!/^\d+$/.test(id)) {
    res.status(400).json({ message: 'categoryId deve ser numérico (id de categoria EONET).' });
    return;
  }
  next();
}
