import { Request, Response } from 'express';
import { NasaFireModel } from '../NASA/NasaFire/NasaFireModels';
import { UsgsEarthquakeService } from '../UsgsEarthquake/UsgsEarthquakeService';
import { DEFAULT_QUERY_PARAMS } from '../UsgsEarthquake/UsgsEarthquakeTypes';
import { GlimsService } from '../GLIMS/GlimsService';
import { OceanPollutionService } from '../OceanPollution/OceanPollutionService';
import { EPA_R9_MARINE_DEBRIS_DATASETS, HTTP_CONFIG as OceanHttpCfg } from '../OceanPollution/OceanPollutionTypes';
import type { ExtinctionService } from '../Extinction/ExtinctionService';
import { GLOBE_LAYER_IDS, GLOBE_SCHEMA_VERSION, LIMITS, type RespostaCamadaGloboV1 } from './GlobeTypes';
import {
  geoJsonParaLixoMarinho,
  geoJsonParaSismos,
  geoJsonParaGeleiras,
  normalizarAmeacadaGbif,
  normalizarIncendio
} from './GlobeNormalization';

function envelope(camadaId: string, pontos: RespostaCamadaGloboV1['pontos'], totalMatching?: number): RespostaCamadaGloboV1 {
  const out: RespostaCamadaGloboV1 = {
    schemaVersion: GLOBE_SCHEMA_VERSION,
    camada: camadaId,
    count: pontos.length,
    pontos
  };
  if (totalMatching !== undefined) {
    out.totalMatching = totalMatching;
  }
  return out;
}

export class GlobeController {
  constructor(
    private readonly deps: {
      usgs: UsgsEarthquakeService;
      ocean: OceanPollutionService;
      glims: GlimsService;
    }
  ) {}

  getDiscovery(_req: Request, res: Response): void {
    res.status(200).json({
      schemaVersion: GLOBE_SCHEMA_VERSION,
      descricao:
        'Camadas normalizadas (`PontoGloboV1`). Por domínio: incêndios em `/api/fire`, oceano em `/api/ocean`; aqui ficam índice completo + sismos e espécies ameaçadas.',
      camadas: [
        {
          id: 'incendio',
          metodoHttp: 'GET',
          caminho: '/api/fire/nasa',
          indiceFornecedores: '/api/fire',
          origemUpstream: '/api/fires',
          parametrosQuery: ['limit', 'source', 'startDate', 'endDate']
        },
        {
          id: 'ameacada_gbif',
          metodoHttp: 'GET',
          caminho: '/api/globe/especies-ameacadas',
          origemUpstream: '/api/extinction',
          requisitosMongo: true,
          parametrosQuery: ['limit', 'category', 'minLatitude', 'maxLatitude', 'minLongitude', 'maxLongitude']
        },
        {
          id: 'sismo',
          metodoHttp: 'GET',
          caminho: '/api/globe/sismos',
          origemUpstream: '/api/earthquakes',
          parametrosQuery: ['limit', '+ parâmetros USGS (starttime, endtime, minmagnitude, ...)']
        },
        {
          id: 'lixo_marinho',
          metodoHttp: 'GET',
          caminho: '/api/ocean/epa',
          indiceFornecedores: '/api/ocean',
          origemUpstream: '/api/ocean-pollution',
          parametrosQuery: ['limit', 'dataset', 'layerId', 'where', 'resultRecordCount']
        },
        {
          id: 'geleira',
          metodoHttp: 'GET',
          caminho: '/api/globe/geleiras',
          indiceFornecedores: '/api/glaciers',
          origemUpstream: '/api/glaciers',
          parametrosQuery: ['layer','bbox','feature_count']
        }
      ],
      tipoValoresGlobe: [...GLOBE_LAYER_IDS],
      limiteGlobo: { padrao: LIMITS.DEFAULT, min: LIMITS.MIN, max: LIMITS.MAX }
    });
  }

  async getIncendios(req: Request, res: Response): Promise<void> {
    try {
      if (!req.app.locals.nasaFireService) {
        res.status(503).json({
          message: 'Incêndios não disponíveis: configure MAP_KEY e aguarde o serviço NASA FIRMS.'
        });
        return;
      }

      const limit = Number.parseInt(String(req.query.limit ?? LIMITS.DEFAULT), 10);
      const { source, startDate, endDate } = req.query;

      const query: Record<string, unknown> = {};
      if (source) query.source = source;
      if (startDate || endDate) {
        query.acq_date = {};
        if (startDate) (query.acq_date as Record<string, string>).$gte = String(startDate);
        if (endDate) (query.acq_date as Record<string, string>).$lte = String(endDate);
      }

      const totalMatching = await NasaFireModel.countDocuments(query);
      const docs = await NasaFireModel.find(query)
        .sort({ acq_date: -1, acq_time: -1 })
        .limit(limit)
        .lean();

      const pontos = docs.map((d) => normalizarIncendio(d as Parameters<typeof normalizarIncendio>[0]));
      res.status(200).json(envelope('incendio', pontos, totalMatching));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Globe incendios:', message);
      res.status(500).json({ message: 'Erro ao montar camada incêndios.', error: message });
    }
  }

  async getEspeciesAmeacadas(req: Request, res: Response): Promise<void> {
    try {
      const ext = req.app.locals.extinctionService as ExtinctionService | undefined;
      if (!ext) {
        res.status(503).json({
          message:
            'Camada GBIF indisponível: aguarde a ligação ao MongoDB (serviço de extinção ainda não iniciado).'
        });
        return;
      }

      const limit = Number.parseInt(String(req.query.limit ?? LIMITS.DEFAULT), 10);
      const category =
        req.query.category !== undefined && String(req.query.category) !== ''
          ? String(req.query.category).trim().toUpperCase()
          : undefined;

      let minLatitude: number | undefined;
      let maxLatitude: number | undefined;
      let minLongitude: number | undefined;
      let maxLongitude: number | undefined;
      if (
        req.query.minLatitude !== undefined &&
        req.query.maxLatitude !== undefined &&
        req.query.minLongitude !== undefined &&
        req.query.maxLongitude !== undefined
      ) {
        minLatitude = Number.parseFloat(String(req.query.minLatitude));
        maxLatitude = Number.parseFloat(String(req.query.maxLatitude));
        minLongitude = Number.parseFloat(String(req.query.minLongitude));
        maxLongitude = Number.parseFloat(String(req.query.maxLongitude));
      }

      const totalMatching = await ext.countOccurrences({
        category,
        minLatitude,
        maxLatitude,
        minLongitude,
        maxLongitude
      });

      const rows = await ext.listOccurrences({
        limit,
        category,
        minLatitude,
        maxLatitude,
        minLongitude,
        maxLongitude
      });

      const pontos = rows.map((d) =>
        normalizarAmeacadaGbif(d as Parameters<typeof normalizarAmeacadaGbif>[0])
      );
      res.status(200).json(envelope('ameacada_gbif', pontos, totalMatching));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Globe especies-ameacadas:', message);
      res.status(500).json({ message: 'Erro ao montar camada espécies ameaçadas.', error: message });
    }
  }

  async getSismos(req: Request, res: Response): Promise<void> {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? LIMITS.DEFAULT), 10);

      const base = this.deps.usgs.parseExpressQuery(req.query as Record<string, unknown>);
      const params: Record<string, string> = {
        ...DEFAULT_QUERY_PARAMS,
        ...base,
        format: 'geojson',
        limit: String(Math.min(limit, 20000))
      };

      const raw = await this.deps.usgs.queryEvents(params);
      let pontos = geoJsonParaSismos(raw);
      if (pontos.length > limit) {
        pontos = pontos.slice(0, limit);
      }

      res.status(200).json(envelope('sismo', pontos));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Globe sismos:', message);
      res.status(500).json({ message: 'Erro ao montar camada sismos.', error: message });
    }
  }
  async getGeleiras(req: Request, res: Response): Promise<void> {
    try {
      const limit = Number.parseInt(
        String(req.query.limit ?? LIMITS.DEFAULT),
        10
      );

      const layer = String(req.query.layer ?? 'outlines');
      const bbox = String(req.query.bbox ?? '-180,-90,180,90');

      const raw = await this.deps.glims.getLayerGeoJson(layer, {
        bbox,
        srs: 'EPSG:4326',
        feature_count: limit
      });

      let pontos = geoJsonParaGeleiras(raw);

      if (pontos.length > limit) {
        pontos = pontos.slice(0, limit);
      }

      res.status(200).json(
        envelope('geleira', pontos)
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);

      console.error('Globe geleiras:', message);

      res.status(500).json({
        message: 'Erro ao montar camada de geleiras.',
        error: message
      });
    }
  }

  async getLixoMarinho(req: Request, res: Response): Promise<void> {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? LIMITS.DEFAULT), 10);
      const dataset = req.query.dataset
        ? String(req.query.dataset)
        : EPA_R9_MARINE_DEBRIS_DATASETS[0];
      const layerId = Number.parseInt(String(req.query.layerId ?? '1'), 10);
      const resultRecordCount = Number.parseInt(
        String(req.query.resultRecordCount ?? Math.min(limit, OceanHttpCfg.MAX_RESULT_RECORD_COUNT)),
        10
      );

      const raw = await this.deps.ocean.queryLayerGeoJson(dataset, layerId, {
        resultRecordCount: Math.min(Math.max(resultRecordCount, 1), OceanHttpCfg.MAX_RESULT_RECORD_COUNT),
        where: req.query.where ? String(req.query.where) : undefined
      });

      let pontos = geoJsonParaLixoMarinho(raw, dataset);
      if (pontos.length > limit) {
        pontos = pontos.slice(0, limit);
      }

      res.status(200).json(envelope('lixo_marinho', pontos));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Globe lixo-marinho:', message);
      res.status(500).json({ message: 'Erro ao montar camada lixo marinho.', error: message });
    }
  }
}
