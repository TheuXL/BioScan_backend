import { Request, Response, NextFunction } from 'express';
import { FEED_WINDOWS, FeedWindow } from './UsgsEarthquakeTypes';

const NUM_RE = /^-?\d+(\.\d+)?$/;

function parseOptionalNumber(
  raw: unknown,
  label: string,
  min: number,
  max: number
): { ok: true; value: number } | { ok: false; message: string } {
  if (raw === undefined || raw === null || raw === '') {
    return { ok: false, message: `Query obrigatória: ${label}.` };
  }
  const s = String(raw);
  if (!NUM_RE.test(s)) {
    return { ok: false, message: `${label} deve ser numérico.` };
  }
  const value = parseFloat(s);
  if (value < min || value > max) {
    return { ok: false, message: `${label} deve estar entre ${min} e ${max}.` };
  }
  return { ok: true, value };
}

function isValidIsoDateTime(s: string): boolean {
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

/**
 * Valida parâmetros opcionais de query antes do proxy USGS.
 */
export function validateEventQuery(req: Request, res: Response, next: NextFunction): void {
  const q = req.query;

  if (q.limit !== undefined && q.limit !== '') {
    const limit = parseOptionalNumber(q.limit, 'limit', 1, 20000);
    if (!limit.ok) {
      res.status(400).json({ message: limit.message });
      return;
    }
  }

  if (q.minmagnitude !== undefined && q.minmagnitude !== '') {
    const mag = parseOptionalNumber(q.minmagnitude, 'minmagnitude', -1, 10);
    if (!mag.ok) {
      res.status(400).json({ message: mag.message });
      return;
    }
  }

  if (q.maxmagnitude !== undefined && q.maxmagnitude !== '') {
    const mag = parseOptionalNumber(q.maxmagnitude, 'maxmagnitude', -1, 10);
    if (!mag.ok) {
      res.status(400).json({ message: mag.message });
      return;
    }
  }

  if (q.starttime !== undefined && q.starttime !== '' && !isValidIsoDateTime(String(q.starttime))) {
    res.status(400).json({ message: 'starttime deve ser data/hora ISO 8601 válida.' });
    return;
  }

  if (q.endtime !== undefined && q.endtime !== '' && !isValidIsoDateTime(String(q.endtime))) {
    res.status(400).json({ message: 'endtime deve ser data/hora ISO 8601 válida.' });
    return;
  }

  if (q.starttime && q.endtime && String(q.starttime) > String(q.endtime)) {
    res.status(400).json({ message: 'starttime não pode ser posterior a endtime.' });
    return;
  }

  const bboxKeys = ['minlatitude', 'maxlatitude', 'minlongitude', 'maxlongitude'] as const;
  const present = bboxKeys.filter((k) => q[k] !== undefined && q[k] !== '');
  if (present.length > 0 && present.length < bboxKeys.length) {
    res.status(400).json({
      message: 'Para filtrar por área, envie minlatitude, maxlatitude, minlongitude e maxlongitude.'
    });
    return;
  }

  for (const key of present) {
    const latLon = key.includes('latitude');
    const parsed = parseOptionalNumber(
      q[key],
      key,
      latLon ? -90 : -180,
      latLon ? 90 : 180
    );
    if (!parsed.ok) {
      res.status(400).json({ message: parsed.message });
      return;
    }
  }

  if (present.length === bboxKeys.length) {
    const minLat = parseFloat(String(q.minlatitude));
    const maxLat = parseFloat(String(q.maxlatitude));
    const minLon = parseFloat(String(q.minlongitude));
    const maxLon = parseFloat(String(q.maxlongitude));
    if (minLat > maxLat || minLon > maxLon) {
      res.status(400).json({
        message: 'minlatitude ≤ maxlatitude e minlongitude ≤ maxlongitude.'
      });
      return;
    }
  }

  next();
}

export function validateFeedWindow(req: Request, res: Response, next: NextFunction): void {
  const window = String(req.params.window || '');
  if (!FEED_WINDOWS.includes(window as FeedWindow)) {
    res.status(400).json({
      message: `window inválido. Valores: ${FEED_WINDOWS.join(', ')}.`
    });
    return;
  }
  next();
}
