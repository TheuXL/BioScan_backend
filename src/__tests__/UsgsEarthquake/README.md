# Testes — USGS Earthquakes (`UsgsEarthquake`)

Integração real com [USGS FDSNWS Event](https://earthquake.usgs.gov/fdsnws/event/1/) e feeds GeoJSON públicos. Sem MongoDB nem chave de API.

## Importante

- Pedidos HTTP reais a `earthquake.usgs.gov`.
- Sem `jest.mock` nem respostas simuladas — asserções sobre GeoJSON vêm da API USGS.

## Executar

```bash
npm test -- src/__tests__/UsgsEarthquake/UsgsEarthquake.test.js
```

## Pré-requisitos

- Rede com acesso a `earthquake.usgs.gov`.

## Cobertura

| Área | Descrição |
|------|-----------|
| `queryEvents` | `FeatureCollection` com `Point`, `mag`, `time`. |
| `getFeed` | Feed `significant_week`. |
| `parseExpressQuery` | Arrays → string; validado com consulta real. |

## Rotas REST

- `GET /api/earthquakes` — proxy FDSNWS (`starttime`, `endtime`, `minmagnitude`, bbox, `limit`, …).
- `GET /api/earthquakes/feed/:window` — feeds (`all_day`, `significant_week`, …).

Código: `src/infrastructure/apis/UsgsEarthquake/`.
