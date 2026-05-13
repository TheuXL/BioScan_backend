# NASA EONET (eventos naturais)

Módulo TypeScript alinhado à [arquitetura do backend](../../../../Arquitetura.md): **Service** / **Controller** / **Routes** / **Types** / **Middleware**. Sem `Models` — proxy **on-demand** (sem MongoDB nem cron).

## Estrutura

```
NasaEonet/
├── NasaEonetController.ts
├── NasaEonetService.ts
├── NasaEonetRoutes.ts
├── NasaEonetTypes.ts
├── NasaEonetMiddleware.ts
└── README.md
```

## Fonte

- **API:** [EONET v2.1](https://eonet.gsfc.nasa.gov/docs/v2.1) — `https://eonet.gsfc.nasa.gov/api/v2.1/`
- **Autenticação:** serviço público NASA, **sem chave**.
- A v2.1 está marcada como *deprecated* na documentação oficial, mas permanece disponível.

## Rotas (`/api/events`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/` | Eventos. Query: `source`, `status` (`open` \| `closed`), `limit`, `days`. Sem `status`, a API EONET devolve por omissão eventos **abertos**. |
| `GET` | `/categories` | Catálogo de categorias. |
| `GET` | `/categories/:categoryId` | Eventos da categoria; mesmas queries que `/`. |
| `GET` | `/sources` | Catálogo de fontes. |
| `GET` | `/layers` | Camadas WMS/WMTS (metadados). |
| `GET` | `/layers/:categoryId` | Camadas filtradas por categoria. |

## Integração no servidor

- Registo em `src/index.js` antes da ligação ao MongoDB.
- Erros upstream → **502**.

## Uso no globo

Geometrias **Point** ou **Polygon** em `geometries`; camadas por categoria (incêndios, vulcões, tempestades, etc.) em paralelo com FIRMS.

## Testes

```bash
npm test -- src/__tests__/NasaEonet/NasaEonet.test.js
```

Ver `src/__tests__/NasaEonet/README.md`.

## Referências

- Catálogo: `FONTES.md` (secção NASA EONET)
