# BioScan Backend

API Node.js que agrega dados ambientais de **fontes públicas globais** (NASA, NOAA, organismos internacionais, etc.), persiste o que fizer sentido em **MongoDB** e expõe tudo via **REST** para aplicações cliente — em especial um **frontend com globo interativo** (estilo “Earth”), onde cada camada de dados pode ser mostrada como pontos ou geometrias sobre o planeta.

Este repositório contém **apenas o backend**. Documentação do frontend será mantida noutro projeto.

---

## Visão do produto (como encaixa o globo)

O objetivo da plataforma BioScan é **tornar visíveis** problemas ambientais globais: incêndios, poluição marinha, derretimento, temperatura, desmatamento, espécies ameaçadas, etc.

- O **backend** é responsável por **integrar dezenas de serviços públicos**, normalizar e guardar dados, e servir **JSON estável** e filtrável.
- O **frontend** (fora deste repo) apresentará um **globo 3D interativo** no qual o utilizador escolhe **que tipo de dados** ver e **onde** navegar; cada registo georreferenciado vindo desta API pode ser desenhado como **marcador**, **heatmap** ou outra camada suportada pela biblioteca de globo (ex.: Cesium, Three.js + globo, Mapbox GL, etc.).

Cada nova fonte pública deve seguir o mesmo padrão: **cliente HTTP → serviço → (opcional) modelo MongoDB → controlador → rota** — para o globo consumir sempre listas com **coordenadas** e metadados consistentes.

---

## Objetivos deste backend

| Objetivo | Descrição |
|----------|-----------|
| **Integração** | Conectar-se a APIs e downloads públicos confiáveis, com chaves onde exigido. |
| **Persistência** | Guardar séries e eventos em coleções MongoDB com índices úteis (tempo, geo, fonte). |
| **API REST** | Expor leitura filtrada e, quando aplicável, sincronização manual ou estado de jobs. |
| **Escalabilidade** | Suportar mais fontes e volume crescente (paginação, limites, quotas respeitadas). |
| **Contrato para o globo** | Respostas com **latitude/longitude** (ou geometria futura) por ponto, mais campos de estilo/cor no cliente. |

---

## Estratégia de URLs: domínio + fornecedor (globo normalizado)

O frontend não deve tratar dezenas de formatos JSON diferentes por instituição. Para **pontos no globo** usa-se um **contrato único** (`PontoGloboV1`): `schemaVersion`, `camada`, `count`, `pontos[]` com `lat`, `lon`, `tipo`, `momento`, `origem`, `idFonte`, `severidade`, etc.

Os caminhos seguem **`/api/<domínio>/<fornecedor>`** quando o utilizador escolhe primeiro o tema e depois a organização que fornece os dados:

| Domínio | Índice (`GET`) | Camada exemplo (`GET`) |
|---------|----------------|-------------------------|
| Fogo | `/api/fire` lista fornecedores | `/api/fire/nasa` — NASA FIRMS (via Mongo + sync). |
| Oceano | `/api/ocean` | `/api/ocean/epa` — EPA R9 Marine Debris (ArcGIS). |

- **`GET /api/globe`** — índice de todas as camadas normalizadas (liga para `/api/fire/...`, `/api/ocean/...`, e mantém também `GET /api/globe/sismos` e `GET /api/globe/especies-ameacadas`).
- **Proxies no formato bruto da fonte** mantêm prefixos próprios: **`/api/fires`** (Mongo FIRMS), **`/api/ocean-pollution`** (ArcGIS direto).

Para novo fornecedor de fogo, adiciona-se `GET /api/fire/<slug>` e uma entrada no JSON de **`GET /api/fire`**; o cliente continua a consumir o mesmo tipo de resposta de pontos.

---

## Catálogo de endpoints e disponibilidade

### Legenda

| Termo | Significado |
|-------|-------------|
| **Completo** | Rota montada e usualmente útil só com rede; sem credenciais opcionais nem dependência de Mongo para **registar** essa rota. |
| **Condicional** | Só existe em certas condições de arranque **ou** devolve `503`/vazio se sync/serviço upstream não estiver pronto. |
| **Planeado** | Ainda não há rota BioScan; visão em `IDEIA.md` ou extensão natural do padrão acima. |

### Condições ao arrancar o Express

| Situação | Efeito |
|----------|--------|
| **Falha de ligação MongoDB** | Não se montam: `/api/fires`, `/api/global-temperature`, `/api/ice-melt`, `/api/extinction`. |
| **Sem `MAP_KEY`** | Não há serviço FIRMS nem `/api/fires`. `GET /api/fire/nasa` responde **503** (contrato globo). |
| **Sem `OPENAQ_API_KEY`** | Ramo **`/api/openaq`** não é registado. |
| **GFW** | Rotas base de **`/api/deforestation`** existem; **`query/json`** precisa de **`GFW_API_KEY`** (+ **`GFW_API_ORIGIN`** alinhado ao domínio da key). |

### Contrato único globo (`PontoGloboV1`) — preferido pelo cliente “globo”

| Método | Rota | Estado | Notas |
|--------|------|--------|-------|
| `GET` | `/api/globe` | Completo | Índice de camadas + limites (`limit`). |
| `GET` | `/api/globe/sismos` | Completo | Parâmetros alinhados ao USGS (`limit`, `starttime`, `endtime`, …). |
| `GET` | `/api/globe/especies-ameacadas` | Condicional | Exige Mongo + `extinctionService` (GBIF); senão **503**. |
| `GET` | `/api/fire` | Completo | Descoberta de fornecedores de fogo. |
| `GET` | `/api/fire/nasa` | Condicional | **MAP_KEY**, Mongo, dados em `nasa_fire`; senão **503**. |
| `GET` | `/api/ocean` | Completo | Descoberta de fornecedores oceânicos normalizados. |
| `GET` | `/api/ocean/epa` | Completo | Lixo marinho EPA → pontos normalizados. |

### Proxies / JSON no formato da fonte (stateless ou quase)

| Método | Rotas | Estado | Notas |
|--------|-------|--------|-------|
| `GET` | `/api/meteo/forecast`, `/api/meteo/archive`, `/api/meteo/air-quality` | Completo | Open-Meteo, sem API key no servidor. |
| `GET` | `/api/earthquakes`, `/api/earthquakes/feed/:window` | Completo | USGS. |
| `GET` | `/api/events`, `/api/events/sources`, `/api/events/categories`, `/api/events/categories/:categoryId`, `/api/events/layers`, `/api/events/layers/:categoryId` | Completo | NASA EONET v2.1. |
| `GET` | `/api/openaq/*` | Condicional | Só com `OPENAQ_API_KEY`: `/parameters`, `/countries`, `/locations`, `/locations/:id`, `/locations/:id/latest`. |
| `GET` | `/api/deforestation`, `/api/deforestation/ping`, `/api/deforestation/datasets` | Completo / metadados | Úteis sem query pesada. |
| `GET` | `/api/deforestation/dataset/:dataset/:version/query/json`, `.../fields` | Condicional | Dados com `GFW_API_KEY`. |
| `GET` | `/api/ocean-pollution`, `/api/ocean-pollution/epa-r9/:dataset/metadata`, `.../layers/:layerId/geojson` | Completo | ArcGIS EPA. |

### Dados em Mongo + sync (formato BioScan / séries)

| Método | Rotas | Estado | Notas |
|--------|-------|--------|-------|
| `GET` | `/api/fires`, `/api/fires/by-country` | Condicional | Montados só com Mongo + `MAP_KEY`. |
| `GET` | `/api/fires/sync-status` | Condicional | Idem. |
| `POST` | `/api/fires/sync` | Condicional | Disparo manual sync FIRMS. |
| `GET` | `/api/global-temperature`, `/api/global-temperature/stats` | Condicional | Só após Mongo; ver módulo GISTEMP. |
| `GET` | `/api/global-temperature/sync-status` | Condicional | |
| `POST` | `/api/global-temperature/sync` | Condicional | |
| `GET` | `/api/ice-melt`, `/api/ice-melt/latest`, `/api/ice-melt/sync-status` | Condicional | Só após Mongo; live vs snapshot — `NasaSeaLevel/README.md`. |
| `POST` | `/api/ice-melt/sync` | Condicional | |
| `GET` | `/api/extinction` | Condicional | Mongo + sync GBIF (IUCN). |
| `GET` | `/api/extinction/sync-status` | Condicional | |
| `POST` | `/api/extinction/sync` | Condicional | |

### Infraestrutura

| Método | Rota | Estado |
|--------|------|--------|
| `GET` | `/health` | Completo — corpo reflecte Mongo, chaves e syncs. |

### Detalhe: NASA FIRMS (dados crus no Mongo)

- **Fonte:** [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) (CSV por área; ver serviço).
- **`MAP_KEY`** no path server-side; coleção **`nasa_fire`**, dedup **`fireId`**.
- **Testes:** `src/__tests__/NasaFire/`, `src/__tests__/MongoDB/`.
- **Globo normalizado:** preferir `GET /api/fire/nasa` (mesmos pontos, contrato `PontoGloboV1`); **`GET /api/fires`** continua para o payload legacy `{ count, data }`.

### Ainda não implementado (roadmap)

- Novos **`/api/fire/<org>`** além de `nasa` (estrutura de rotas e contrato prontos; falta fonte + normalização).
- Novos **`/api/ocean/<org>`** além de `epa`.
- Contrato **`PontoGloboV1`** para outras áreas hoje só em proxy cru (ex.: desmatamento, meteo em pontos fixos, ar).
- **OpenAPI/Swagger**, paginação unificada, **auth** em API pública.
- Temas em **`IDEIA.md`** sem rotas ainda (camadas satélite, mais gelo/uso do solo, etc.).

### Referências de código

- Globo: `src/infrastructure/apis/Globe/`
- FIRMS: `NASA/NasaFire/`, GISTEMP / Sea level: `NASA/NasaGistemp/`, `NASA/NasaSeaLevel/`
- Restantes módulos: pastas em `src/infrastructure/apis/` com o nome do serviço.

---

## Variáveis de ambiente

Cria um ficheiro `.env` na raiz do projeto (podes partir de `.env.example`):

```env
PORT=3000
NODE_ENV=development

# MongoDB (local ou Docker)
MONGODB_URI=mongodb://localhost:27017/bio_scan_db

# NASA FIRMS — obrigatória para sincronizar e expor incêndios
# Pedido em: https://firms.modaps.eosdis.nasa.gov/api/map_key
MAP_KEY=sua_map_key_aqui

# OpenAQ API v3 — https://explore.openaq.org/register
OPENAQ_API_KEY=

# GFW Data API — https://data-api.globalforestwatch.org/ (Authentication); necessário para /api/deforestation/.../query/json
GFW_API_KEY=
# Origin enviado com a chave (deve coincidir com os "domains" da key na GFW); p.ex. http://localhost ou https://api.teudominio.com
# GFW_API_ORIGIN=http://localhost

# Nível do mar — ver src/infrastructure/apis/NASA/NasaSeaLevel/README.md
# SEA_LEVEL_DATA_URL=https://...
# SEA_LEVEL_ALLOW_BUNDLED_FALLBACK=false
```

Opcional:

- **`FIRMS_SYNC_MAX_RECORDS`** — em **testes**, o Jest define um limite por defeito para não processar CSV mundial completo; em **produção** normalmente **não** defines esta variável (processa todos os registos devolvidos).
- **`SEA_LEVEL_DATA_URL`** / **`SEA_LEVEL_ALLOW_BUNDLED_FALLBACK`** — ver módulo nível do mar.
- **`EXTINCTION_GBIF_MAX_RECORDS_PER_SYNC`**, **`EXTINCTION_GBIF_PAGE_SIZE`**, **`EXTINCTION_GBIF_IUCN_CATEGORIES`** — sincronização `/api/extinction` (GBIF; sem chave).

---

## Como correr

**Requisitos:** Node.js 18+ recomendado, MongoDB acessível.

```bash
npm install
npm run dev    # nodemon + ts-node para módulos .ts
# ou
npm start
```

**Docker:** `docker-compose up --build` — repassa variáveis do `.env`/host conforme `docker-compose.yml` e `.env.example` (MAP_KEY, OpenAQ, GFW, nível do mar, extinção GBIF, etc.).

---

## API HTTP (referência rápida)

A lista **completa**, com estado **Completo / Condicional / Planeado**, está na secção **[Catálogo de endpoints e disponibilidade](#catálogo-de-endpoints-e-disponibilidade)** (acima neste README).

| Prefixo | Função |
|---------|--------|
| `/api/globe`, `/api/fire`, `/api/ocean` | Contrato único `PontoGloboV1` para o globo (índice + camadas por fornecedor). |
| `/api/fires` | Incêndios FIRMS no Mongo (formato legacy da API BioScan). |
| `/api/meteo` | Open-Meteo. |
| `/api/earthquakes` | USGS. |
| `/api/events` | NASA EONET. |
| `/api/openaq` | OpenAQ (se chave definida). |
| `/api/deforestation` | GFW Data API. |
| `/api/ocean-pollution` | ArcGIS EPA (GeoJSON bruto). |
| `/api/global-temperature` | GISTEMP (Mongo). |
| `/api/ice-melt` | Nível do mar / degelo. |
| `/api/extinction` | GBIF + IUCN (Mongo). |
| `/health` | Estado do processo e dependências. |

---

## Estrutura relevante do código

```
src/
├── index.js                          # Express, MongoDB, montagem de rotas
├── infrastructure/apis/Globe/        # Contrato PontoGloboV1: /api/globe, /api/fire, /api/ocean
├── infrastructure/apis/NASA/
│   ├── NasaFire/                     # FIRMS → /api/fires (+ /api/fire/nasa normalizado)
│   ├── NasaGistemp/
│   ├── NasaSeaLevel/
│   └── NasaEonet/
├── infrastructure/apis/OpenMeteo/
├── infrastructure/apis/UsgsEarthquake/
├── infrastructure/apis/OpenAq/
├── infrastructure/apis/GlobalForestWatch/
├── infrastructure/apis/OceanPollution/
├── infrastructure/apis/Extinction/
└── __tests__/                        # Jest + ts-jest; ver src/__tests__/README.md
```

Documentação detalhada por módulo: `src/infrastructure/apis/NASA/NasaFire/README.md`, `src/infrastructure/apis/NASA/README.md`.

---

## Próximos passos (integração contínua)

1. **FIRMS:** monitorizar quotas NASA; alargar `COUNTRY_BBOX` ou alternativa GeoJSON quando o endpoint país voltar a estar estável.
2. **Novos fornecedores** sob `/api/fire/*` e `/api/ocean/*` (mesmo contrato `PontoGloboV1`).
3. **Prioridade sugerida:** mais fontes oceânicas e de gelo (NSIDC, Copernicus); alargar GBIF com quotas; normalizar GFW/meteo para pontos de globo quando fizer sentido.
4. **Qualidade:** paginação, cache ou tiles, OpenAPI, autenticação se a API for pública na Internet.

---

## Licença

ISC License.
