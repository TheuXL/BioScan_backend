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
| **API / doc** | [Climate Tools](https://api.climatetools.org/sea-level) · [NASA Sea Level](https://sealevel.nasa.gov/data/) |
| **Resumo** | HTTP JSON; sem chave; serviço pode ter indisponibilidade pontual (503). |
| **Entrega** | **JSON** (estrutura do fornecedor; guardada como `Mixed` em MongoDB). |
| **Uso BioScan** | `GET /api/ice-melt` (live), `GET /api/ice-melt/latest`, `POST /api/ice-melt/sync`, coleção `nasa_sea_level`. |
| **Globo** | Curva temporal ou indicador; não pontos por incêndio. |

---

## Recomendadas a seguir (bom encaixe com o globo)

### NASA EONET (eventos naturais)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | **Incêndios, tempestades, vulcões, gelo, inundações**, etc. — eventos georreferenciados. |
| **API / doc** | [EONET API](https://eonet.gsfc.nasa.gov/) |
| **Resumo** | Categorias e eventos com geometria; atualização contínua; uso público conforme termos NASA. |
| **Entrega** | **JSON** (GeoJSON-like / coordenadas nos eventos). |
| **Uso BioScan** | Novo módulo: sync opcional → MongoDB → `GET /api/events` ou por categoria. |
| **Globo** | **Pontos, polígonos ou linhas** por tipo de evento; camadas toggláveis junto com FIRMS. |

### USGS Earthquakes (sismos)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | **Sismos** (magnitude, profundidade, tempo, epicentro). |
| **API / doc** | [USGS FDSNWS Event](https://earthquake.usgs.gov/fdsnws/event/1/) |
| **Resumo** | Parâmetros de tempo, magnitude, região; formato **GeoJSON**; serviço público. |
| **Entrega** | **GeoJSON**, CSV, KML, etc. |
| **Uso BioScan** | Polling ou pedidos por janela temporal → guardar ou proxy → `GET /api/earthquakes`. |
| **Globo** | **Pontos**; tamanho/cor = magnitude; profundidade em tooltip ou eixo Z simbólico. |

### OpenAQ (qualidade do ar)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | Medições de **PM2.5, PM10, O₃, NO₂**, etc., em estações **com coordenadas**. |
| **API / doc** | [OpenAQ API](https://docs.openaq.org/) |
| **Resumo** | API REST; registo pode exigir token conforme versão/plano; ver limites atuais. |
| **Entrega** | **JSON** (localizações + medições). |
| **Uso BioScan** | Agregar por região ou últimas N horas → coleção própria ou cache. |
| **Globo** | **Pontos** ou heatmap por poluente; ideal para “saúde + ambiente”. |

### Open-Meteo (meteorologia)

| Campo | Detalhe |
|-------|---------|
| **O que traz** | **Tempo atual / previsão**, histórico, em alguns casos **qualidade do ar**; sem chave no tier gratuito. |
| **API / doc** | [Open-Meteo](https://open-meteo.com/en/docs) |
| **Resumo** | Modelos ECMRF/GFS; parâmetros por `latitude` e `longitude`. |
| **Entrega** | **JSON**. |
| **Uso BioScan** | On-demand ao clicar no globo ou camada “meteo contextual”. |
| **Globo** | Não substitui séries climáticas longas (GISTEMP); útil para **contexto local** ou animação leve. |

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

| Campo | Detalhe |
|-------|---------|
| **O que traz** | **Alertas de desmatamento**, perda de cobertura florestal. |
| **API / doc** | [GFW Developer Resources](https://www.globalforestwatch.org/help/developers/) |
| **Resumo** | Muitas vezes **API com chave** e termos de uso restritos; validar licença comercial. |
| **Entrega** | **JSON** / tiles em alguns produtos. |
| **Uso BioScan** | Stub `GlobalForestWatchApi.js`; definir produto e chave. |
| **Globo** | **Polígonos ou pontos de alerta**; muito alinhado à narrativa ambiental. |

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
| **Sismos** | USGS | Pontos |
| **Eventos naturais vários** | EONET | Pontos / geometrias |
| **Ar poluído** | OpenAQ | Pontos / heatmap |
| **Nível do mar / degelo (séries)** | NASA Sea Level, NOAA | Curvas / KPI |
| **Gelo / neve** | NSIDC | Camada ou série |
| **Floresta / desmatamento** | GFW | Alertas / polígonos |
| **Satélite “Earth view”** | GIBS | Tiles |
| **Uso do solo** | WorldCover | Raster colorido |
| **Meteo local** | Open-Meteo | Tooltip / camada leve |

---

## Manutenção deste ficheiro

- Ao **integrar** uma fonte nova: adicionar linha na secção “Já integradas” e link para o módulo em `src/infrastructure/`.
- Ao **mudar** URL ou formato: atualizar coluna **Entrega** e **Resumo**.
- Respeitar sempre **termos de uso**, **atribuição** e **quotas** de cada fornecedor.

Última revisão conceitual: alinhada ao README do backend BioScan (globo + API REST).
