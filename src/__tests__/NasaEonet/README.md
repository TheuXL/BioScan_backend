# Testes — NASA EONET (`NasaEonet`)

Integração real com [NASA EONET API v2.1](https://eonet.gsfc.nasa.gov/docs/v2.1). Sem MongoDB nem chave de API.

## Importante

- Pedidos HTTP reais a `eonet.gsfc.nasa.gov`.
- Sem `jest.mock` nem respostas simuladas.

## Executar

```bash
npm test -- src/__tests__/NasaEonet/NasaEonet.test.js
```

## Pré-requisitos

- Rede com acesso a `eonet.gsfc.nasa.gov`.

## Cobertura

| Área | Descrição |
|------|-----------|
| `getEvents` | Lista `events` com `geometries`. |
| `getCategories` | Catálogo `categories`. |
| `getCategoryEvents` | Eventos por `categoryId` (ex.: 12). |
| `getSources` | Catálogo `sources`. |
| `getLayers` | Metadados de camadas. |
| `parseExpressQuery` | `source` múltiplo → CSV; validado com GET real. |

## Rotas REST

- `GET /api/events`
- `GET /api/events/categories`, `/categories/:categoryId`
- `GET /api/events/sources`
- `GET /api/events/layers`, `/layers/:categoryId`

Código: `src/infrastructure/apis/NASA/NasaEonet/`.
