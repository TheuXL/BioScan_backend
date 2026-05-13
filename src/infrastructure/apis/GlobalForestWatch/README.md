# Global Forest Watch — Data API (desmatamento / alertas)

Módulo TypeScript alinhado à [arquitetura do backend](../../../../../Arquitetura.md): **Service** / **Controller** / **Routes** / **Types** / **Middleware**. Sem `Models` — proxy à [GFW Data API](https://data-api.globalforestwatch.org/).

## Fonte

- **API:** [GFW Data API](https://data-api.globalforestwatch.org/) · [Developers](https://www.globalforestwatch.org/help/developers/)
- **Chave:** necessária para **`query/json`** (cabeçalho `x-api-key`). Criar chave na documentação **Authentication** da API.
- **Termos:** respeitar [Terms of Use](https://www.globalforestwatch.org/terms) e quotas da plataforma.

## Variável de ambiente

- **`GFW_API_KEY`** (ou `GFW_DATA_API_KEY`) — nunca expor ao frontend; só o backend envia o cabeçalho.
- **`GFW_API_ORIGIN`** (opcional) — valor do cabeçalho `Origin` nas chamadas com chave. Deve corresponder a um dos **domains** registados na criação da API key na GFW (ex.: chave com `localhost` → omitir ou usar `http://localhost`). Em produção, define o origin do teu domínio público (ex.: `https://api.teudominio.com`).

## Rotas (`/api/deforestation`)

| Método | Caminho | Chave API |
|--------|---------|-----------|
| `GET` | `/` | Não — metadados e lista de sub-rotas |
| `GET` | `/ping` | Não |
| `GET` | `/datasets` | Não |
| `GET` | `/dataset/:dataset/:version/fields` | Não (comportamento atual da API pública) |
| `GET` | `/dataset/:dataset/:version/query/json` | **Sim** — query `sql` obrigatória; opcionais `geostore_id`, `geostore_origin` |

Exemplo de dataset de alertas: `gfw_integrated_alerts` com `version=latest` (ver `GlobalForestWatchTypes.EXAMPLE_INTEGRATED_ALERTS_DATASET`).

## SQL e geostore

As consultas seguem a documentação GFW (SQL + opcionalmente polígono via `geostore_id`). O BioScan **repassa** o pedido; valida apenas tamanho máximo de `sql` e formato de `dataset`/`version`.

**Raster vs vetor:** datasets como `gfw_integrated_alerts` são **raster** — a GFW devolve *"Raster tile set queries require a geometry"* sem `geostore_id`. Para SQL simples sem geometria, use um dataset **vetorial** (ex.: limites administrativos) ou inclua `geostore_id` conforme a doc.

## Testes

```bash
npm test -- src/__tests__/GlobalForestWatch/GlobalForestWatch.test.js
```

## Stub legado

O ficheiro `GlobalForestWatchApi.js` na mesma pasta é **legado**; usar este módulo TypeScript.

## Checklist (produção)

1. **`GFW_API_KEY`** (ou `GFW_DATA_API_KEY`) nas variáveis do runtime — nunca no frontend nem em repositório público.
2. **`GFW_API_ORIGIN`** igual a um dos **domains** registados na criação da key na GFW; em produção evita depender só do defeito `http://localhost`.
3. **`GET /health`** — confirmar `globalForestWatch.hasApiKey: true` e, se usares key restrita a domínios, `apiOriginEnvSet: true` (e `usingDefaultGfwOrigin: false`).
4. **Raster** (`gfw_integrated_alerts`, etc.): consultas SQL exigem **`geostore_id`** onde a GFW o exigir; datasets vetoriais não.
5. **Testes:** `npm test -- src/__tests__/GlobalForestWatch/GlobalForestWatch.test.js` (com chave no `.env` para cobrir `query/json`).
