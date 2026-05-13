import { Request, Response, NextFunction } from 'express';

const POSITIVE_INT_RE = /^[1-9]\d*$/;

export function validateLocationsQuery(req: Request, res: Response, next: NextFunction): void {
  const lim = req.query.limit;
  if (lim !== undefined && lim !== '') {
    const s = String(lim);
    if (!POSITIVE_INT_RE.test(s)) {
      res.status(400).json({ message: 'limit deve ser inteiro positivo.' });
      return;
    }
  }
  next();
}

export function validateLocationIdParam(req: Request, res: Response, next: NextFunction): void {
  const id = String(req.params.id || '').trim();
  if (!id || id.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    res.status(400).json({ message: 'id de localização inválido.' });
    return;
  }
  next();
}
