import type { PontoGloboV1 } from './GlobeTypes';

function isoOrNull(d?: Date | string | null): string | null {
  if (d === undefined || d === null) return null;
  if (d instanceof Date) return d.toISOString();
  const t = Date.parse(String(d));
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

function momentoIncendioFirms(acq_date: string, acq_time?: string): string | null {
  if (!acq_date || !/^\d{4}-\d{2}-\d{2}$/.test(acq_date)) return null;
  if (acq_time && /^\d{3,4}$/.test(acq_time)) {
    const padded = acq_time.padStart(4, '0');
    const hh = padded.slice(0, 2);
    const mm = padded.slice(2, 4);
    return `${acq_date}T${hh}:${mm}:00.000Z`;
  }
  return `${acq_date}T12:00:00.000Z`;
}

/** NASA FIRMS armazenado em MongoDB (`nasa_fire`). */
export function normalizarIncendio(doc: {
  _id?: unknown;
  latitude: number;
  longitude: number;
  acq_date: string;
  acq_time?: string;
  confidence?: string;
  frp?: number;
  source: string;
  fireId?: string;
  daynight?: string;
  satellite?: string;
}): PontoGloboV1 {
  const id =
    doc.fireId ??
    `${doc.latitude}_${doc.longitude}_${doc.acq_date}_${doc.acq_time ?? ''}_${doc.source}`;
  const momento = momentoIncendioFirms(doc.acq_date, doc.acq_time);

  return {
    lat: doc.latitude,
    lon: doc.longitude,
    tipo: 'incendio',
    momento,
    origem: 'NASA FIRMS',
    idFonte: String(id),
    severidade: doc.confidence ?? doc.frp ?? null,
    titulo: `Incêndio (${doc.source})`,
    detalhes: {
      confidence: doc.confidence,
      frp: doc.frp,
      daynight: doc.daynight,
      satellite: doc.satellite,
      acq_date: doc.acq_date,
      acq_time: doc.acq_time
    }
  };
}

/** GBIF — coleção `extinction_gbif_occurrence`. */
export function normalizarAmeacadaGbif(doc: {
  gbifOccurrenceKey: number;
  latitude: number;
  longitude: number;
  scientificName: string;
  iucnRedListCategory: string;
  country?: string;
  eventDate?: string;
  taxonKey?: number;
}): PontoGloboV1 {
  return {
    lat: doc.latitude,
    lon: doc.longitude,
    tipo: 'ameacada_gbif',
    momento: isoOrNull(doc.eventDate ?? null),
    origem: 'GBIF (categoria Lista Vermelha no índice)',
    idFonte: `gbif:${doc.gbifOccurrenceKey}`,
    severidade: doc.iucnRedListCategory,
    titulo: doc.scientificName,
    detalhes: {
      iucnRedListCategory: doc.iucnRedListCategory,
      country: doc.country,
      taxonKey: doc.taxonKey
    }
  };
}

interface UsgsFeature {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: number[];
  };
  properties?: Record<string, unknown>;
}

/** USGS FDSNWS GeoJSON Feature. */
export function normalizarSismoFeature(f: UsgsFeature, index: number): PontoGloboV1 | null {
  const coords = f.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lon, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const p = f.properties ?? {};
  const mag = p.mag ?? p.Mag;
  const timeMs = typeof p.time === 'number' ? p.time : undefined;
  const id = String(p.id ?? p.code ?? `${lat}_${lon}_${timeMs ?? index}`);

  return {
    lat,
    lon,
    tipo: 'sismo',
    momento: timeMs !== undefined ? new Date(timeMs).toISOString() : null,
    origem: 'USGS Earthquake Hazards',
    idFonte: `usgs:${id}`,
    severidade: typeof mag === 'number' ? mag : typeof mag === 'string' ? mag : null,
    titulo: typeof p.place === 'string' ? `Sismo · ${p.place}` : typeof p.title === 'string' ? String(p.title) : 'Sismo',
    detalhes: {
      depthKm: coords[2],
      magType: p.magType,
      status: p.status,
      tsunami: p.tsunami,
      url: p.url
    }
  };
}

interface GeoJsonFeatureLike {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
  id?: unknown;
}

/** GeoJSON pontual EPA / ArcGIS para lixo marinho. */
export function normalizarLixoMarinhoFeature(
  f: GeoJsonFeatureLike,
  dataset: string,
  index: number
): PontoGloboV1 | null {
  const g = f.geometry;
  if (g?.type !== 'Point') return null;
  const coords = g.coordinates as number[];
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const [lon, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const props = f.properties ?? {};
  const oid = props.OBJECTID ?? props.objectid ?? f.id ?? index;
  const desc =
    props.Descriptio ??
    props.description ??
    props.name ??
    props.Debris_Type ??
    props.debris_cat;

  return {
    lat,
    lon,
    tipo: 'lixo_marinho',
    momento: isoOrNull(
      props.Date != null ? (typeof props.Date === 'number' ? new Date(props.Date) : String(props.Date)) : null
    ),
    origem: 'EPA R9 Marine Debris (ArcGIS)',
    idFonte: `epa_r9:${dataset}:${oid}`,
    severidade:
      props.Debris_Cat !== undefined ? String(props.Debris_Cat) : props.Debris_Type != null ? String(props.Debris_Type) : null,
    titulo: typeof desc === 'string' ? desc : 'Observação de lixo marinho',
    detalhes: {
      dataset,
      ...props
    }
  };
}

export function geoJsonParaSismos(data: unknown): PontoGloboV1[] {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('features' in data) ||
    !Array.isArray((data as { features: unknown }).features)
  ) {
    return [];
  }
  const features = (data as { features: UsgsFeature[] }).features;
  const out: PontoGloboV1[] = [];
  features.forEach((f, i) => {
    const p = normalizarSismoFeature(f, i);
    if (p) out.push(p);
  });
  return out;
}

export function geoJsonParaLixoMarinho(data: unknown, dataset: string): PontoGloboV1[] {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('features' in data) ||
    !Array.isArray((data as { features: unknown }).features)
  ) {
    return [];
  }
  const features = (data as { features: GeoJsonFeatureLike[] }).features;
  const out: PontoGloboV1[] = [];
  features.forEach((f, i) => {
    const p = normalizarLixoMarinhoFeature(f, dataset, i);
    if (p) out.push(p);
  });
  return out;
}
