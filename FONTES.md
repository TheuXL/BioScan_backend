# Fontes de dados públicas — BioScan Backend

Catálogo de serviços públicos (ou com tier gratuito) alinhados ao **globo interativo** e às camadas ambientais do BioScan: incêndios, clima, oceanos, eventos naturais, qualidade do ar, etc.

Para cada fonte: **o que traz**, **onde está a API/doc**, **como os dados chegam**, **como o projeto pode usar** (backend + ideia de uso no frontend/globo).

---

## Legenda rápida

| Tipo de entrega | Adequação ao globo 3D |
|-----------------|------------------------|
| Pontos (lat/lon) / GeoJSON | Alta — marcadores, clusters |
| Séries temporais (sem mapa) | Média — gráficos, painel ao lado do globo |
| Tiles raster (WMTS/XYZ) | Alta — textura ou overlay no globo |
| CSV / texto tabular | Variável — parse no backend (como FIRMS/GISTEMP) |

---

## Já integradas ou referenciadas no repositório

### NASA FIRMS (incêndios ativos)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | Focos de calor / deteções de fogo (satélite MODIS, VIIRS); **fogo**. |
| **API / doc** | [FIRMS API](https://firms.modaps.eosdis.nasa.gov/api/area/) · [Map key](https://firms.modaps.eosdis.nasa.gov/api/map_key) |
| **Resumo** | Chave gratuita `MAP_KEY`; limite de transações por janela de tempo. Área via `world` ou bbox; dia 1–5. |
| **Entrega** | **CSV** (e JSON de área instável no serviço); colunas latitude, longitude, datas, confiança, FRP, etc. |
| **Uso BioScan** | `NasaFireService` → MongoDB `nasa_fire` → `GET /api/fires`. |
| **Globo** | Pontos **lat/lon**; cor/tamanho por intensidade ou confiança. |

### NASA GISTEMP (temperatura global)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | **Anomalias** de temperatura superficial global (terra–oceano ou só terra); **temperatura / clima**. |
| **API / doc** | [GISTEMP data](https://data.giss.nasa.gov/gistemp/) |
| **Resumo** | Séries mensais desde ~1880; ficheiros `.txt` em `tabledata_v4/`; sem chave. |
| **Entrega** | **Texto fixo** (colunas ano + Jan–Dez); valores em centésimas no ficheiro → convertidos a °C no backend. |
| **Uso BioScan** | `NasaGistempService` → MongoDB `nasa_gistemp` → `GET /api/global-temperature`, `/stats`. |
| **Globo** | Não são milhares de pontos; usar **gráfico temporal**, faixas de cor (“climate stripes”) ou painel junto ao globo. |

### Nível do mar / contexto de degelo (módulo `NasaSeaLevel/`)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | Séries de **nível médio global do mar** (proxy via API pública agregada); relacionado com **degelo / oceano**. |
| **API / doc** | [Climate Tools](https://api.climatetools.org/sea-level) (DNS instável) · [NASA CMR](https://cmr.earthdata.nasa.gov/search) (fallback metadados) · [NASA Sea Level](https://sealevel.nasa.gov/data/) |
| **Resumo** | Ordem: `SEA_LEVEL_DATA_URL` → Climate Tools → CMR; snapshot empacotado em dev se tudo falhar. Sem chave. |
| **Entrega** | **JSON** (estrutura do fornecedor; guardada como `Mixed` em MongoDB). |
| **Uso BioScan** | `GET /api/ice-melt` (live), `GET /api/ice-melt/latest`, `POST /api/ice-melt/sync`, coleção `nasa_sea_level`. |
| **Globo** | Curva temporal ou indicador; não pontos por incêndio. |

### Open-Meteo (meteorologia contextual)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | **Tempo atual / previsão**, arquivo histórico, **qualidade do ar** (API dedicada); sem chave no tier gratuito. |
| **API / doc** | [Open-Meteo](https://open-meteo.com/en/docs) · [Archive](https://open-meteo.com/en/docs/historical-weather-api) · [Air quality](https://open-meteo.com/en/docs/air-quality-api) |
| **Resumo** | Modelos ECMWF/GFS; parâmetros por `latitude` e `longitude`; entrega **JSON**. |
| **Uso BioScan** | Módulo `OpenMeteo/` — proxy on-demand: `GET /api/meteo/forecast`, `GET /api/meteo/archive`, `GET /api/meteo/air-quality` (sem MongoDB). |
| **Globo** | Contexto local ao clicar no globo ou camada “meteo”; não substitui séries longas (GISTEMP). |

### USGS Earthquakes (sismos)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | **Sismos** (magnitude, profundidade, tempo, epicentro). |
| **API / doc** | [USGS FDSNWS Event](https://earthquake.usgs.gov/fdsnws/event/1/) · [Feeds GeoJSON](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) |
| **Resumo** | Consulta por janela temporal, magnitude, bbox; **GeoJSON**; serviço público. |
| **Uso BioScan** | Módulo `UsgsEarthquake/` — `GET /api/earthquakes`, `GET /api/earthquakes/feed/:window` (sem MongoDB). |
| **Globo** | **Pontos**; tamanho/cor por magnitude; profundidade em tooltip. |

### NASA EONET (eventos naturais)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | **Incêndios, tempestades, vulcões, gelo, inundações**, etc. — eventos georreferenciados. |
| **API / doc** | [EONET v2.1](https://eonet.gsfc.nasa.gov/docs/v2.1) |
| **Resumo** | Categorias, fontes, camadas WMS/WMTS; geometrias GeoJSON (Point/Polygon); API pública NASA. |
| **Uso BioScan** | Módulo `NasaEonet/` — `GET /api/events`, `/categories`, `/sources`, `/layers` (sem MongoDB). |
| **Globo** | Pontos, polígonos ou linhas por tipo; camadas toggláveis junto com FIRMS. |

### OpenAQ (qualidade do ar — estações, API v3)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | Medições e metadados de **PM2.5, PM10, O₃, NO₂**, etc., em **locais** com coordenadas. |
| **API / doc** | [OpenAQ v3](https://docs.openaq.org/about/about) · [Chave API](https://docs.openaq.org/using-the-api/api-key) |
| **Resumo** | REST + JSON; **chave** no cabeçalho `X-API-Key`; variável `OPENAQ_API_KEY` no backend. v1/v2 retirados. |
| **Uso BioScan** | Módulo `OpenAq/` — `GET /api/openaq/locations`, `/locations/:id`, `/locations/:id/latest`, `/countries`, `/parameters`. |
| **Globo** | **Pontos** por estação; complementa Open-Meteo (modelo vs medições in situ). |

### Global Forest Watch — Data API (desmatamento / alertas)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | Datasets e **consultas SQL** sobre alertas (ex.: integrados), metadados de campos, catálogo de datasets. |
| **API / doc** | [GFW Data API](https://data-api.globalforestwatch.org/) · [Developers](https://www.globalforestwatch.org/help/developers/) |
| **Resumo** | REST + JSON; `query/json` exige **`x-api-key`**; `ping` / `datasets` / `fields` usáveis sem chave (comportamento atual). |
| **Uso BioScan** | Módulo `GlobalForestWatch/` — `GET /api/deforestation` (info), `/ping`, `/datasets`, `/dataset/.../fields`, `/dataset/.../query/json`. |
| **Globo** | Resultados de SQL / geostore conforme produto escolhido; respeitar termos e limites GFW. |

### EPA R9 — Marine Debris (lixo marinho / observações)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | Observações de **lixo marinho** (pontos, atributos EPA) em MapServers públicos. |
| **API / doc** | [ArcGIS REST — R9MarineDebris](https://gispub.epa.gov/arcgis/rest/services/R9MarineDebris) |
| **Resumo** | ArcGIS REST; **sem chave**; `query` com `f=geojson`. |
| **Uso BioScan** | Módulo `OceanPollution/` — `GET /api/ocean-pollution`, `/epa-r9/:dataset/metadata`, `/epa-r9/:dataset/layers/:layerId/geojson`. |
| **Globo** | **GeoJSON** com `Point` — marcadores no globo. |

### GBIF — ocorrências com categorias Lista Vermelha IUCN (índice GBIF)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | Milhões de **ocorrências** de espécies com coordenadas; muitas com categoria **Lista Vermelha** (ex.: CR, EN, VU) indexada pelo GBIF (não substitui licenciamento comercial da IUCN). |
| **API / doc** | [GBIF Occurrence API](https://www.gbif.org/developer/occurrence) · [Citação](https://www.gbif.org/citation-guidelines) |
| **Resumo** | REST + JSON; **sem chave** para volumes moderados; usar com **User-Agent** identificável e respeitar políticas GBIF. |
| **Uso BioScan** | Módulo `Extinction/` — sincronização paginada → MongoDB `extinction_gbif_occurrence`; `GET /api/extinction`, `/sync-status`, `POST /sync`. |
| **Globo** | Um ponto por ocorrência (`latitude`/`longitude`); legenda por `iucnRedListCategory`. |

---

## Recomendadas a seguir (bom encaixe com o globo)

### NASA EONET (eventos naturais)

*Integrado — ver secção **Já integradas** (`NasaEonet/`, `/api/events`).*

### USGS Earthquakes (sismos)

*Integrado — ver secção **Já integradas** (`UsgsEarthquake/`, `/api/earthquakes`).*

### OpenAQ (estações — API v3)

*Integrado — ver secção **Já integradas** (`OpenAq/`, `/api/openaq`).*

### Open-Meteo

*Integrado — ver secção **Já integradas** (`OpenMeteo/`, `/api/meteo`).*

---

## Camadas raster / satélite (textura no globo)

### NASA GIBS (imagens globais)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | **Tiles** de satélite e produtos (incêndio, neve, aerosóis, etc.). |
| **API / doc** | [NASA GIBS API](https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+API+for+Developers) |
| **Resumo** | WMTS / TMS / XYZ; muitos produtos globais diários ou quase reais. |
| **Entrega** | **Imagens** (PNG/JPEG) por tile. |
| **Uso BioScan** | O frontend pode consumir tiles direto; o backend pode só documentar URLs ou servir proxy/caching. |
| **Globo** | **Overlay** no mesmo estilo Earth; forte impacto visual. |

### ESA WorldCover (uso do solo)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | **Cobertura do solo** (floresta, água, urbano, culturas…). |
| **API / doc** | [WorldCover](https://worldcover2020.esa.int/) |
| **Resumo** | Raster global; acesso frequentemente via WMS/WCS ou downloads; ver licença CC-BY-SA. |
| **Entrega** | **Raster** / serviços OGC. |
| **Uso BioScan** | Camada estática ou anual no globo; mais trabalho de integração que uma REST simples. |
| **Globo** | **Máscara colorida** sobre o planeta; complementa desmatamento/incêndio. |

---

## Clima, oceano e gelo (agregados ou ficheiros)

### NOAA NCEI

| Campo | Detalhe |
|-------|---------|
| **O que traz** | **Clima**, **oceano**, paleoclima; muitos conjuntos agregados e algumas APIs. |
| **API / doc** | [NCEI](https://www.ncei.noaa.gov/) · [Access](https://www.ncei.noaa.gov/access) |
| **Resumo** | Produtos heterogéneos; alguns CSV/NetCDF; ver dataset específico. |
| **Entrega** | **Variado** (REST em alguns serviços, ficheiros em outros). |
| **Uso BioScan** | Escolher 1–2 datasets (ex. anomalias SST) e normalizar no backend. |
| **Globo** | Gráficos ou, com grade interpolada, mapa 2D texturado. |

### NSIDC (neve e gelo)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | **Gelo marinho**, **superfície gelada**, derivados polares. |
| **API / doc** | [NSIDC](https://nsidc.org/) |
| **Resumo** | Muitos dados via download ou serviços especializados; pode exigir conta Earthdata para alguns produtos. |
| **Entrega** | **NetCDF**, GeoTIFF, etc. |
| **Uso BioScan** | Pipeline de ingestão mais pesado; adequado a fase 2. |
| **Globo** | Extensão de gelo ártico/antártico como **camada** ou série temporal. |

### Copernicus Marine / Climate

| Campo | Detalhe |
|-------|---------|
| **O que traz** | **Oceano** (correntes, cor, nível em produtos específicos), **clima**. |
| **API / doc** | [Copernicus Marine](https://marine.copernicus.eu/) |
| **Resumo** | Registo gratuito; quotas; subset via API/toolbox. |
| **Entrega** | **NetCDF** / serviços de dados marinhos. |
| **Uso BioScan** | Já existe stub `CopernicusApi.js`; evoluir para um produto concreto. |
| **Globo** | Camadas oceânicas ou vetores se exportados para GeoJSON. |

---

## Biodiversidade e uso do solo

### Global Forest Watch (desmatamento)

*Integrado — ver secção **Já integradas** (`GlobalForestWatch/`, `/api/deforestation`).*

### IUCN Red List (espécies ameaçadas)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | Dados de **espécies** e **ameaça**; nem sempre geo fino. |
| **API / doc** | [IUCN Red List API](https://apiv3.iucnredlist.org/) |
| **Resumo** | **Token** necessário; termos de uso a respeitar. |
| **Entrega** | **JSON**. |
| **Uso BioScan** | Stub `IUCNRedListApi.js`; filtrar por região quando possível. |
| **Globo** | Pontos grosseiros ou painel por espécie; depende dos campos geográficos devolvidos. |

---

## Poluição marinha / resíduos

| Fonte | O que traz | Entrega | Uso BioScan / globo |
|-------|------------|---------|---------------------|
| **NOAA Marine Debris** | Programas, relatórios, alguns dados espaciais | Web / downloads | Integração **caso a caso**; pode ser CSV/GeoJSON em campanhas. |
| **The Ocean Cleanup / dados abertos** | Concentrações, rios (conforme publicação) | Variado | Pontos ou polilinhas se houver coords. |
| **UNEP / projeitos regionais** | **Lixo marinho**, praias | Relatórios + dados | Normalmente requer escolher um dataset estável. |

*Recomendação:* fixar **um** conjunto com **GeoJSON ou CSV+lat/lon** documentado antes de codificar.

---

## Resumo por “tipo de dado” no globo

| Tema | Fontes candidatas | Forma no globo |
|------|-------------------|----------------|
| **Fogo** | FIRMS (já), EONET | Pontos |
| **Temperatura global** | GISTEMP (já) | Gráfico / painel |
| **Sismos** | USGS (já: `/api/earthquakes`) | Pontos |
| **Eventos naturais vários** | EONET (já: `/api/events`) | Pontos / geometrias |
| **Ar poluído** | OpenAQ v3 (já: `/api/openaq`) | Pontos / heatmap |
| **Nível do mar / degelo (séries)** | NASA Sea Level, NOAA | Curvas / KPI |
| **Gelo / neve** | NSIDC | Camada ou série |
| **Floresta / desmatamento** | GFW Data API (já: `/api/deforestation`) | SQL / alertas / polígonos (geostore) |
| **Lixo marinho / observações** | EPA R9 ArcGIS (já: `/api/ocean-pollution`) | Pontos (GeoJSON) |
| **Espécies em risco (ocorrências)** | GBIF + IUCN no índice (já: `/api/extinction`) | Pontos / clusters |
| **Satélite “Earth view”** | GIBS | Tiles |
| **Uso do solo** | WorldCover | Raster colorido |
| **Meteo local** | Open-Meteo (já: `/api/meteo`) | Tooltip / camada leve |
| **Ar (estações)** | OpenAQ v3 (já: `/api/openaq`) | Pontos / heatmap |

## Manutenção deste ficheiro

- Ao **integrar** uma fonte nova: adicionar linha na secção “Já integradas” e link para o módulo em `src/infrastructure/`.
- Ao **mudar** URL ou formato: atualizar coluna **Entrega** e **Resumo**.
- Respeitar sempre **termos de uso**, **atribuição** e **quotas** de cada fornecedor.

Última revisão conceitual: alinhada ao README do backend BioScan (globo + API REST).
