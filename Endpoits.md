# BioScan — catálogo de endpoints (frontend)

Referência para configurar o cliente HTTP do frontend. Base URL em desenvolvimento: **`http://localhost:3000`** (ou proxy Vite — ver [`frontend/docs/Arquitetura.md`](frontend/docs/Arquitetura.md)).

**Legenda de disponibilidade**

| Tag | Significado |
|-----|-------------|
| **Sempre** | Rota registada ao arrancar o servidor (só precisa de rede). |
| **Chave** | Exige variável no `.env` do backend. |
| **Mongo** | Rota só existe após ligação MongoDB bem-sucedida. |

**Legenda de uso no frontend**

| Modo | Descrição |
|------|-----------|
| **Globo** | Consumir como `RespostaCamadaGloboV1` → desenhar `pontos[]` no Cesium. |
| **Painel** | Gráfico, KPI ou detalhe lateral (série temporal, meteo local). |
| **Proxy** | JSON/GeoJSON upstream; adaptar no frontend ou usar camada Globe equivalente. |
| **Descoberta** | Índice de rotas; não desenha pontos. |

---

## Convenções HTTP

### Base URL e proxy (Vite)

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''; // vazio em dev → proxy /api

async function apiGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body);
  }
  return res.json() as Promise<T>;
}
```

### Erros comuns

| HTTP | Quando | Corpo típico |
|------|--------|--------------|
| **400** | Query/path inválidos | `{ message: string, allowed?: string[] }` |
| **404** | Recurso inexistente (ex.: snapshot sea level) | `{ message: string }` |
| **500** | Erro interno / Mongo | `{ message: string, error?: string }` |
| **502** | Upstream indisponível e **sem** cache | `{ message: string, error?: string }` |
| **503** | Módulo desactivado (sem chave, sem FIRMS, sem Mongo) | `{ message: string, hint?: string }` |

### Fallback de cache (`bioscan_meta`)

Proxies com Mongo ligado podem responder **200** com dados antigos quando a fonte externa falha. Procurar:

```json
{
  "bioscan_meta": {
    "fromBioScanCache": true,
    "note": "… indisponível — resposta a partir do cache BioScan (MongoDB)."
  }
}
```

OpenAQ `/locations` em fallback usa `meta.fromBioScanCache` no envelope reconstruído.

---

## Contrato `PontoGloboV1` (globo)

Tipos partilhados — copiar para `frontend/src/api/types/globe.ts`:

```typescript
export interface PontoGloboV1 {
  lat: number;
  lon: number;
  tipo: string;           // incendio | sismo | lixo_marinho | ameacada_gbif
  momento: string | null; // ISO 8601
  origem: string;
  idFonte: string;
  severidade: string | number | null;
  titulo?: string;
  detalhes?: Record<string, unknown>;
}

export interface RespostaCamadaGloboV1 {
  schemaVersion: '1.0';
  camada: string;
  count: number;
  totalMatching?: number;
  offset?: number;
  limit?: number;
  hasMore?: boolean;
  pontos: PontoGloboV1[];
}
```

**Paginação (globo):** `limit` default **500**, máx. **50 000**; `offset` default **0**. Para carregar **todos** os focos (ex. 15 701): `GET /api/fire/nasa?limit=20000` ou páginas sucessivas com `offset` enquanto `hasMore === true`.

| `tipo` | Endpoint Globe | `severidade` típica |
|--------|----------------|---------------------|
| `sismo` | `GET /api/globe/sismos` | magnitude |
| `incendio` | `GET /api/fire/nasa` | confiança ou FRP |
| `lixo_marinho` | `GET /api/ocean/epa` | categoria/tipo de detritos |
| `ameacada_gbif` | `GET /api/globe/especies-ameacadas` | CR, EN, VU, … |
| `geleira` | `GET /api/globe/geleiras` | nulo (área/nome em `detalhes`) |

---

## 1. Saúde e descoberta

### `GET /health` — **Sempre** · Descoberta

**Chamada**

```http
GET /health
```

**Resposta 200**

```json
{
  "status": "healthy",
  "mongodb": "connected | disconnected",
  "fireSync": { "isRunning": true, "lastSyncTime": "…" } | null,
  "gistempSync": { … } | null,
  "seaLevelSync": { … } | null,
  "openMeteo": { "mode": "on-demand", "basePath": "/api/meteo" },
  "usgsEarthquakes": { "mode": "on-demand", "basePath": "/api/earthquakes" },
  "nasaEonet": { "mode": "on-demand", "basePath": "/api/events", "apiVersion": "2.1" },
  "openAq": { "enabled": true, "basePath": "/api/openaq" } | { "enabled": false, "hint": "…" },
  "globalForestWatch": { "hasApiKey": false, "queryRequiresKey": true, … },
  "oceanPollution": { "basePath": "/api/ocean-pollution", … },
  "globe": { "contract": "PontoGloboV1 (schemaVersion 1.0)", … },
  "extinction": { "mode": "sync + read", … } | { "enabled": false, … }
}
```

**Frontend:** usar no boot da app para saber quais camadas activar (`openAq.enabled`, `mongodb`, etc.).

---

## 2. Globo normalizado (`PontoGloboV1`)

### `GET /api/globe` — **Sempre** · Descoberta

**Chamada**

```http
GET /api/globe
```

**Resposta 200**

```json
{
  "schemaVersion": "1.0",
  "descricao": "…",
  "camadas": [
    {
      "id": "incendio",
      "metodoHttp": "GET",
      "caminho": "/api/fire/nasa",
      "indiceFornecedores": "/api/fire",
      "parametrosQuery": ["limit", "source", "startDate", "endDate"]
    },
    {
      "id": "ameacada_gbif",
      "caminho": "/api/globe/especies-ameacadas",
      "requisitosMongo": true,
      "parametrosQuery": ["limit", "category", "minLatitude", "maxLatitude", "minLongitude", "maxLongitude"]
    },
    { "id": "sismo", "caminho": "/api/globe/sismos", … },
    { "id": "lixo_marinho", "caminho": "/api/ocean/epa", … }
  ],
  "tipoValoresGlobe": ["incendio", "ameacada_gbif", "sismo", "lixo_marinho"],
  "limiteGlobo": { "padrao": 500, "min": 1, "max": 50000, "offset": true }
}
```

**Frontend:** `fetchGlobeIndex()` → popular `layers/registry.ts` e marcar `disponivel`.

---

### `GET /api/globe/sismos` — **Sempre** · **Globo**

**Chamada**

```http
GET /api/globe/sismos?limit=500
GET /api/globe/sismos?limit=500&offset=500&minmagnitude=4
GET /api/globe/sismos?limit=500&minmagnitude=4&starttime=2026-01-01
```

| Query | Obrigatório | Descrição |
|-------|-------------|-----------|
| `limit` | Não (default **500**) | Inteiro **1–50000** |
| `offset` | Não (default **0**) | Saltar N resultados (paginação) |
| *USGS* | Não | Repassados ao USGS: `minmagnitude`, `maxmagnitude`, `starttime`, `endtime`, `minlatitude`, `maxlatitude`, `minlongitude`, `maxlongitude` |

**Resposta 200** — `RespostaCamadaGloboV1`

```json
{
  "schemaVersion": "1.0",
  "camada": "sismo",
  "count": 42,
  "pontos": [
    {
      "lat": -22.1,
      "lon": -68.2,
      "tipo": "sismo",
      "momento": "2026-05-15T18:30:00.000Z",
      "origem": "USGS Earthquake Hazards",
      "idFonte": "usgs:us7000abcd",
      "severidade": 4.5,
      "titulo": "Sismo · 45 km NE of …",
      "detalhes": { "depthKm": 10, "magType": "mb", "tsunami": 0, "url": "https://…" }
    }
  ]
}
```

**Frontend**

```typescript
const data = await apiGet<RespostaCamadaGloboV1>('/api/globe/sismos', { limit: 500 });
renderPoints(data.pontos, 'sismos');
```

---

### `GET /api/globe/especies-ameacadas` — **Mongo** · **Globo**

**Chamada**

```http
GET /api/globe/especies-ameacadas?limit=150
GET /api/globe/especies-ameacadas?limit=100&category=CR
GET /api/globe/especies-ameacadas?limit=150&minLatitude=-35&maxLatitude=-5&minLongitude=-75&maxLongitude=-35
```

| Query | Descrição |
|-------|-----------|
| `limit` | **1–50000** (default 500) |
| `offset` | ≥ 0 (paginação) |
| `category` | IUCN: `EX`, `EW`, `CR`, `EN`, `VU`, `NT`, `LC`, `DD`, `CD` |
| `minLatitude`, `maxLatitude`, `minLongitude`, `maxLongitude` | Bbox — **os quatro** ou nenhum |

**Resposta 200** — `RespostaCamadaGloboV1` com `camada: "ameacada_gbif"`, `totalMatching` opcional.

**503** se Mongo/sync GBIF ainda não iniciou.

**Frontend:** cor por `severidade` (CR vermelho, EN laranja, VU amarelo).

---

### `GET /api/globe/geleiras` — **Sempre** · **Globo**

**Chamada**

```http
GET /api/globe/geleiras?limit=50
GET /api/globe/geleiras?limit=100&offset=0&layer=outlines&bbox=-74,-56,-32,13
```

| Query | Descrição |
|-------|-----------|
| `limit` | **1–50000** (default 500) |
| `offset` | ≥ 0 |
| `layer` | Alias GLIMS (`outlines`, `rgi`, `rgi70`, `extinct`) ou `GLIMS:…` |
| `bbox` | `minLon,minLat,maxLon,maxLat` |
| `feature_count` | Quantidade pedida ao WFS (default cobre `limit+offset`) |

**Resposta 200** — `RespostaCamadaGloboV1`, `camada: "geleira"`, `tipo: "geleira"`. Proxy cru: `/api/glaciers`.

---

### `GET /api/fire` — **Sempre** · Descoberta

Índice do domínio fogo. Resposta: `schemaVersion`, `dominio: "fire"`, lista `fornecedores[]` com `caminho: "/api/fire/nasa"`.

---

### `GET /api/fire/nasa` — **Mongo + MAP_KEY** · **Globo**

**Chamada**

```http
GET /api/fire/nasa?limit=20000
GET /api/fire/nasa?limit=5000&offset=0
GET /api/fire/nasa?limit=5000&offset=5000&source=VIIRS_SNPP_NRT&startDate=2026-05-01&endDate=2026-05-15
```

| Query | Descrição |
|-------|-----------|
| `limit` | **1–50000** (default 500) — um pedido pode cobrir todos os focos típicos |
| `offset` | ≥ 0 — paginação; resposta inclui `totalMatching` e `hasMore` |
| `source` | `MODIS_NRT`, `VIIRS_SNPP_NRT`, `VIIRS_NOAA20_NRT` |
| `startDate`, `endDate` | `YYYY-MM-DD` |

**Resposta 200** — `RespostaCamadaGloboV1`, `camada: "incendio"`, `totalMatching` = total no Mongo antes do limit.

**503** sem `MAP_KEY` / serviço FIRMS.

---

### `GET /api/ocean` — **Sempre** · Descoberta

Índice domínio oceano → fornecedor EPA em `/api/ocean/epa`.

---

### `GET /api/ocean/epa` — **Sempre** · **Globo**

**Chamada**

```http
GET /api/ocean/epa?limit=150
GET /api/ocean/epa?limit=50&dataset=ER1402150_MarineDebrisData&layerId=1&where=1%3D1
```

| Query | Default | Descrição |
|-------|---------|-----------|
| `limit` | 500 | **1–50000** pontos no globo; `offset` para páginas |
| `dataset` | `ER1402150_MarineDebrisData` | Ver lista em `/api/ocean-pollution` |
| `layerId` | `1` | Camada MapServer (0–99) |
| `where` | — | Cláusula ArcGIS (ex. `1=1`) |
| `resultRecordCount` | min(limit, 1000) | Registos pedidos à EPA |

**Datasets permitidos:** `ER1402150_MarineDebrisData`, `LosAngeles_ApproachingZeroTrash`, `SanFranciscoBayArea_BaselineTrashLoadEstimate`

**Resposta 200** — `RespostaCamadaGloboV1`, `camada: "lixo_marinho"`, `tipo: "lixo_marinho"`.

---

## 3. Proxies geográficos (formato upstream)

Preferir rotas **Globo** acima quando existirem. Usar estas para detalhe bruto ou camadas ainda não normalizadas.

### USGS — `/api/earthquakes` — **Sempre** · **Proxy**

#### `GET /api/earthquakes`

Query repassada ao USGS FDSNWS (`format=geojson`, `orderby=time`, `limit=100` por defeito).

```http
GET /api/earthquakes?limit=100&minmagnitude=4.5&starttime=2026-01-01T00:00:00Z
```

**Resposta 200:** GeoJSON `FeatureCollection` USGS.

**502** upstream + sem cache.

#### `GET /api/earthquakes/feed/:window`

| `window` | Exemplos |
|----------|----------|
| `all_hour`, `all_day`, `all_week`, `all_month` | |
| `significant_hour`, … | |

**Resposta 200:** GeoJSON feed pré-agregado.

---

### NASA EONET — `/api/events` — **Sempre** · **Proxy**

Eventos naturais (incêndios, tempestades, vulcões…) — JSON EONET v2.1, **sem** `PontoGloboV1`.

| Método | Path | Query |
|--------|------|-------|
| GET | `/api/events` | `status` (`open`/`closed`), `limit`, `days`, `source`, … |
| GET | `/api/events/categories` | — |
| GET | `/api/events/categories/:categoryId` | idem eventos |
| GET | `/api/events/sources` | — |
| GET | `/api/events/layers` | — |
| GET | `/api/events/layers/:categoryId` | — |

**Resposta 200:** JSON EONET (eventos com geometrias/coordenadas).

**Frontend:** camada futura no globo; hoje parsear geometrias manualmente ou aguardar normalização backend.

---

### EPA Ocean (raw) — `/api/ocean-pollution` — **Sempre** · **Proxy**

#### `GET /api/ocean-pollution`

Descoberta: `datasets[]`, `endpoints`, `upstreamBase`.

#### `GET /api/ocean-pollution/epa-r9/:dataset/metadata`

**Resposta 200:** JSON ArcGIS MapServer (`f=pjson`).

#### `GET /api/ocean-pollution/epa-r9/:dataset/layers/:layerId/geojson`

| Query | Default |
|-------|---------|
| `where` | `1=1` |
| `resultRecordCount` ou `limit` | 25 (max 1000) |
| `outFields` | `*` |

**Resposta 200:** GeoJSON FeatureCollection EPA.

**Frontend:** preferir `GET /api/ocean/epa` para pontos normalizados.

---

### GLIMS Geleiras (raw) — `/api/glaciers` — **Sempre** · **Proxy**

| Método | Path | Notas |
|--------|------|-------|
| GET | `/api/glaciers` | Descoberta |
| GET | `/api/glaciers/capabilities` | XML WMS |
| GET | `/api/glaciers/layers/:layerName/geojson` | GeoJSON WFS (`bbox`, `feature_count`, `srs`, `cql_filter`) |

**Frontend:** preferir `GET /api/globe/geleiras` (`PontoGloboV1`). Env cache: `GLIMS_PROXY_RECONCILIATION_MODE`, `GLIMS_PROXY_TTL_SEC`.

---

### OpenAQ — `/api/openaq` — **Chave (`OPENAQ_API_KEY`)** · **Proxy**

| Método | Path | Notas |
|--------|------|-------|
| GET | `/api/openaq/parameters` | Catálogo poluentes |
| GET | `/api/openaq/countries` | `limit` opcional |
| GET | `/api/openaq/locations` | Estações; cache por recurso |
| GET | `/api/openaq/locations/:id` | Detalhe |
| GET | `/api/openaq/locations/:id/latest` | Medições recentes |

**Resposta 200:** JSON OpenAQ v3 (passthrough). Estações têm coordenadas — adaptar a pontos no frontend.

**502** sem cache; rota **não existe** se chave ausente.

---

### GFW — `/api/deforestation` — **Proxy** (query **Chave**)

| Método | Path | Chave |
|--------|------|-------|
| GET | `/api/deforestation` | Não |
| GET | `/api/deforestation/ping` | Não |
| GET | `/api/deforestation/datasets` | Não |
| GET | `/api/deforestation/dataset/:dataset/:version/fields` | Recomendada |
| GET | `/api/deforestation/dataset/:dataset/:version/query/json?sql=…` | **Obrigatória** |

**Query `query/json`:** `sql` (obrigatório), opcional `geostore_id`, etc.

**503** em `query/json` sem `GFW_API_KEY`.

**Resposta 200:** JSON GFW Data API.

---

### Open-Meteo — `/api/meteo` — **Sempre** · **Painel**

| Método | Path | Query obrigatória |
|--------|------|-------------------|
| GET | `/api/meteo/forecast` | `latitude`, `longitude` |
| GET | `/api/meteo/archive` | `latitude`, `longitude`, `start_date`, `end_date` (`YYYY-MM-DD`) |
| GET | `/api/meteo/air-quality` | `latitude`, `longitude` |

Parâmetros Open-Meteo adicionais repassados (`hourly`, `daily`, `current`, …).

**Resposta 200:** JSON Open-Meteo (estrutura oficial da API).

**Frontend:** tooltip ou painel ao clicar no globo — **não** camada global de pontos.

```typescript
await apiGet('/api/meteo/forecast', {
  latitude: -23.55,
  longitude: -46.63,
  forecast_days: 7
});
```

---

## 4. MongoDB + sync (dados persistidos)

Rotas **Mongo** não são registadas se a ligação inicial ao MongoDB falhar.

### NASA FIRMS — `/api/fires` — **Mongo + MAP_KEY**

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/fires` | Lista Mongo `{ count, data: INasaFire[] }` |
| GET | `/api/fires/by-country` | Live NASA por país (`countryCode` ISO-3, `source`, `days` 1–5) |
| GET | `/api/fires/sync-status` | Estado do cron |
| POST | `/api/fires/sync` | Sync manual (`source` no body/query) |

Documento fire (legacy):

```json
{
  "latitude": -10.2,
  "longitude": -55.1,
  "acq_date": "2026-05-15",
  "acq_time": "1430",
  "confidence": "high",
  "frp": 12.5,
  "source": "VIIRS_SNPP_NRT",
  "fireId": "…"
}
```

**Frontend:** preferir **`GET /api/fire/nasa`** (`PontoGloboV1`).

---

### GISTEMP — `/api/global-temperature` — **Mongo**

| Método | Path | Query |
|--------|------|-------|
| GET | `/api/global-temperature` | `startYear`, `endYear`, `stationType` (`Land-Ocean`, `Land-Only`, `Ocean-Only`), `month` (`Jan`…`Dec`) |
| GET | `/api/global-temperature/stats` | `stationType` |
| GET | `/api/global-temperature/sync-status` | — |
| POST | `/api/global-temperature/sync` | body opcional `{ stationType }` |

**Resposta GET /**

```json
{
  "count": 1744,
  "data": [
    { "year": 2024, "month": "Jan", "anomaly": 1.35, "stationType": "Land-Ocean" }
  ]
}
```

**Frontend:** gráfico de linha / climate stripes — **Painel**, não globo.

---

### Nível do mar — `/api/ice-melt` — **Mongo** (parcial live)

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/ice-melt` | Fetch live (várias URLs; fallback JSON empacotado só em dev) |
| GET | `/api/ice-melt/latest` | `{ source, payload, fetchedAt, … }` ou **404** |
| GET | `/api/ice-melt/sync-status` | — |
| POST | `/api/ice-melt/sync` | Grava snapshot |

**Frontend:** KPI + mini gráfico a partir de `payload` — **Painel**.

---

### Extinction / GBIF — `/api/extinction` — **Mongo**

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/extinction` | Ocorrências `{ count, totalMatching, data[], source }` |
| GET | `/api/extinction/sync-status` | — |
| POST | `/api/extinction/sync` | body `{ maxRecords?, categories? }` |

**GET /** query: `limit` (1–500), `category`, bbox (4 params).

Documento em `data[]`:

```json
{
  "gbifOccurrenceKey": 123,
  "latitude": -23.5,
  "longitude": -46.6,
  "scientificName": "…",
  "iucnRedListCategory": "CR",
  "country": "BR",
  "eventDate": "2019-06-01"
}
```

**Frontend:** preferir **`GET /api/globe/especies-ameacadas`**.

---

## 5. Mapa rápido frontend → endpoint

| UI / camada | Endpoint principal | Modo | Requisitos |
|-------------|-------------------|------|------------|
| Índice camadas | `GET /api/globe` | Descoberta | — |
| Sismos | `GET /api/globe/sismos` | Globo | — |
| Incêndios | `GET /api/fire/nasa` | Globo | Mongo + MAP_KEY |
| Lixo marinho | `GET /api/ocean/epa` | Globo | — |
| Geleiras | `GET /api/globe/geleiras` | Globo | — |
| Espécies ameaçadas | `GET /api/globe/especies-ameacadas` | Globo | Mongo |
| Temperatura global | `GET /api/global-temperature` | Painel | Mongo |
| Nível do mar | `GET /api/ice-melt/latest` | Painel | Mongo + sync |
| Meteo local | `GET /api/meteo/forecast` | Painel | lat/lon |
| Qualidade do ar local | `GET /api/meteo/air-quality` | Painel | lat/lon |
| Eventos naturais | `GET /api/events` | Proxy | — |
| Estações ar (OpenAQ) | `GET /api/openaq/locations` | Proxy | OPENAQ_API_KEY |
| Desmatamento (GFW) | `GET /api/deforestation/.../query/json` | Proxy | GFW_API_KEY |
| Boot / diagnóstico | `GET /health` | Descoberta | — |

---

## 6. TanStack Query — chaves sugeridas

```typescript
['health']
['globe', 'index']
['globe', 'sismos', { limit, ...usgsFilters }]
['globe', 'especies', { limit, category, bbox }]
['fire', 'nasa', { limit, source, startDate, endDate }]
['ocean', 'epa', { limit, dataset, layerId }]
['panel', 'gistemp', { stationType, startYear, endYear }]
['panel', 'sea-level', 'latest']
['panel', 'meteo', 'forecast', { lat, lon }]
```

---

## 7. Manutenção

Ao adicionar rota no backend:

1. Registar neste ficheiro (path, query, resposta, modo frontend).
2. Actualizar secção **4** de [`frontend/docs/Arquitetura.md`](frontend/docs/Arquitetura.md).
3. Adicionar entrada em `frontend/src/layers/registry.ts` se for camada de globo.

Última revisão: alinhada ao código em `src/index.js` e rotas em `src/infrastructure/apis/`.
