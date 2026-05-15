# USGS Earthquakes (sismos)

Módulo TypeScript alinhado à [arquitetura do backend](../../../../Arquitetura.md): **Service** / **Controller** / **Routes** / **Types** / **Middleware**. Proxy público aos FDSNWS/feeds USGS; com **MongoDB** ligado usa **`proxy_cache_entries`** como blob por pedido (**`UsgsEarthquakeProxyCacheConfig.ts`**, env `USGS_PROXY_*`).

## Estrutura

```
UsgsEarthquake/
├── UsgsEarthquakeController.ts   # Respostas HTTP
├── UsgsEarthquakeService.ts      # FDSNWS query + feeds GeoJSON
├── UsgsEarthquakeRoutes.ts       # Montagem em /api/earthquakes
├── UsgsEarthquakeTypes.ts        # URLs, defaults, janelas de feed
├── UsgsEarthquakeMiddleware.ts   # Validação de query e feed
└── README.md
```

## Fonte

- **Consulta:** [USGS FDSNWS Event](https://earthquake.usgs.gov/fdsnws/event/1/query) — `format=geojson`
- **Feeds:** [GeoJSON summary feeds](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) — `…/feed/v1.0/summary/{window}.geojson`
- **Autenticação:** serviço público, **sem chave**.

## Rotas (`/api/earthquakes`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/feed/:window` | Feed GeoJSON agregado. `window`: `all_hour`, `all_day`, `all_week`, `all_month`, `significant_hour`, `significant_day`, `significant_week`, `significant_month` (`UsgsEarthquakeTypes.FEED_WINDOWS`). |
| `GET` | `/` | Proxy FDSNWS. Defaults: `format=geojson`, `orderby=time`, `limit=100`. Query opcional: `starttime`, `endtime`, `minmagnitude`, `maxmagnitude`, bbox (`minlatitude`…`maxlongitude`), `limit`, `eventid`, etc. |

## Integração no servidor

- Registo em `src/index.js` **antes** da ligação ao MongoDB (proxy stateless).
- Erros upstream → **502** com mensagem genérica.

## Uso no globo

**Pontos** (`FeatureCollection` / `Point`); tamanho ou cor por `properties.mag`; profundidade e tempo em tooltip.

## Testes

```bash
npm test -- src/__tests__/UsgsEarthquake/UsgsEarthquake.test.js
```

Integração real contra USGS (sem mocks). Ver `src/__tests__/UsgsEarthquake/README.md`.

## Referências

- Catálogo: `FONTES.md` (secção USGS Earthquakes)
