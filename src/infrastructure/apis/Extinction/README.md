# Extinção / espécies em risco (GBIF + IUCN indexado)

Dados **reais** da [API pública GBIF](https://www.gbif.org/) — ocorrências com **coordenadas** e categoria **Lista Vermelha IUCN** tal como indexada no GBIF (`CR`, `EN`, `VU`, etc.). **Sem chave API.**

## Persistência

- Coleção MongoDB: **`extinction_gbif_occurrence`**
- `upsert` por `gbifOccurrenceKey` (chave única da ocorrência no GBIF).
- Sincronização inicial no arranque + cron semanal (ver `ExtinctionTypes.SYNC_CONFIG`).

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `EXTINCTION_GBIF_MAX_RECORDS_PER_SYNC` | Máximo de ocorrências a processar por sincronização (paginado). Predefinição: 600. |
| `EXTINCTION_GBIF_PAGE_SIZE` | Tamanho de página GBIF (≤ 300). Predefinição: 300. |
| `EXTINCTION_GBIF_IUCN_CATEGORIES` | Lista separada por vírgulas, ex.: `CR,EN,VU`. Predefinição: `CR,EN,VU`. |

## Rotas (`/api/extinction`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/` | Lista ocorrências na base. Query: `limit`, `category`, bbox opcional nos quatro cantos. |
| `GET` | `/sync-status` | Estado do cron e última sincronização. |
| `POST` | `/sync` | Dispara sincronização. Corpo opcional: `{ "maxRecords": 500, "categories": ["CR","EN"] }`. |

## Citação

Respeitar [GBIF citation guidelines](https://www.gbif.org/citation-guidelines).

## Legado

`IUCNRedList/IUCNRedListApi.js` é placeholder; usar este módulo.
