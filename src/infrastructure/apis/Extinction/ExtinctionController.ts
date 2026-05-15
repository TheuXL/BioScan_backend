import { Request, Response } from 'express';
import { ExtinctionService } from './ExtinctionService';
import { GbifIucnCategory } from './ExtinctionTypes';

const CITATION_URL = 'https://www.gbif.org/citation-guidelines';

export class ExtinctionController {
  constructor(private readonly service: ExtinctionService) {}

  /** GET / — ocorrências em MongoDB (sincronizadas a partir da API GBIF). */
  async getOccurrences(req: Request, res: Response): Promise<void> {
    try {
      const limit = Number.parseInt(String(req.query.limit ?? '100'), 10);
      const category =
        req.query.category !== undefined && req.query.category !== null && String(req.query.category) !== ''
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

      const totalMatching = await this.service.countOccurrences({
        category,
        minLatitude,
        maxLatitude,
        minLongitude,
        maxLongitude
      });
      const data = await this.service.listOccurrences({
        limit,
        category,
        minLatitude,
        maxLatitude,
        minLongitude,
        maxLongitude
      });

      res.status(200).json({
        count: data.length,
        totalMatching,
        data,
        source: {
          id: this.service.getSourceId(),
          provider: 'GBIF Occurrence API',
          note:
            'Ocorrências georreferenciadas com categoria Lista Vermelha IUCN indexada no GBIF. Cite os dados segundo as diretrizes GBIF.',
          citationGuidelinesUrl: CITATION_URL
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Extinction getOccurrences:', message);
      res.status(500).json({ message: 'Não foi possível ler ocorrências da base de dados.', error: message });
    }
  }

  getSyncStatus(_req: Request, res: Response): void {
    res.status(200).json(this.service.getSyncStatus());
  }

  async triggerSync(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as { maxRecords?: number; categories?: string[] } | undefined;
      const categories = body?.categories?.length
        ? (body.categories.map((c) => String(c).trim().toUpperCase()) as GbifIucnCategory[])
        : undefined;

      const result = await this.service.syncThreatenedOccurrences({
        maxRecords: body?.maxRecords,
        categories
      });

      res.status(200).json({
        message: 'Sincronização GBIF concluída.',
        ...result
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Extinction triggerSync:', message);
      res.status(500).json({ message: 'Sincronização GBIF falhou.', error: message });
    }
  }
}
