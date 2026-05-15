# Testes — Global Forest Watch (`GlobalForestWatch`)

Integração real com [GFW Data API](https://data-api.globalforestwatch.org/).

## Sem chave

- `getPing`, `getDatasets`, `getFields` — correm sempre.
- Serviço sem chave: `queryJson` deve falhar com mensagem sobre `GFW_API_KEY`.
- Rotas Express sem chave: `GET /api/deforestation/.../query/json` → **503**.

## Com chave (`GFW_API_KEY` no `.env`)

- **`query/json` (serviço)** — SQL sobre dataset vetorial de smoke (`VECTOR_QUERY_SMOKE_DATASET` em `GlobalForestWatchTypes.ts`, hoje `gadm_adm0_africa`). `gfw_integrated_alerts` é **raster** na GFW e exige `geostore_id` para consultas SQL.
- **HTTP (`supertest`)** — `GET /`, `GET .../query/json` com SQL, e `400` sem parâmetro `sql`.

A GFW exige cabeçalho **`Origin`** compatível com os **domains** registados na criação da API key. O backend envia `GFW_API_ORIGIN` ou, por defeito, `http://localhost`.

## Executar

```bash
npm test -- src/__tests__/GlobalForestWatch/GlobalForestWatch.test.js
```

Rotas: `src/infrastructure/apis/GlobalForestWatch/` e `/api/deforestation`.
