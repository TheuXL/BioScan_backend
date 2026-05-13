import { Request, Response, NextFunction } from 'express';

/** Alinhado ao padrão OpenAPI GFW para `dataset`. */
const DATASET_RE = /^[a-z][a-z0-9_-]{2,}$/;
/** `v1.2` ou `latest`. */
const VERSION_RE = /^v\d{1,8}(\.\d{1,3}){0,2}$|^latest$/;

export function validateDatasetVersionParams(req: Request, res: Response, next: NextFunction): void {
  const { dataset, version } = req.params;
  const d = String(dataset || '');
  const v = String(version || '');
  if (!DATASET_RE.test(d)) {
    res.status(400).json({ message: 'Parâmetro dataset inválido (ver documentação GFW).' });
    return;
  }
  if (!VERSION_RE.test(v)) {
    res.status(400).json({ message: 'Parâmetro version inválido (use v… ou latest).' });
    return;
  }
  next();
}

const MAX_SQL_LEN = 50_000;

export function validateSqlQueryParam(req: Request, res: Response, next: NextFunction): void {
  const sql = req.query.sql;
  if (sql === undefined || sql === null || String(sql).trim() === '') {
    res.status(400).json({
      message: 'Query obrigatória: sql (instrução SQL suportada pela GFW Data API).'
    });
    return;
  }
  const s = String(sql);
  if (s.length > MAX_SQL_LEN) {
    res.status(400).json({ message: `sql excede o limite de ${MAX_SQL_LEN} caracteres.` });
    return;
  }
  next();
}
