# Testes — Open-Meteo (`OpenMeteo`)

Testes de integração do cliente **OpenMeteoService** contra as APIs públicas [Open-Meteo](https://open-meteo.com/en/docs). Não usam MongoDB nem chaves de API.

## Importante

- **Pedidos HTTP reais** aos hosts `api.open-meteo.com`, `archive-api.open-meteo.com` e `air-quality-api.open-meteo.com`.
- **Sem `jest.mock`**, sem fixtures de corpo HTTP e sem valores inventados só para “passar” o teste — as asserções sobre dados meteorológicos baseiam-se na **resposta real** da API.
- O tier gratuito não exige token; respeita [termos e uso justo](https://open-meteo.com/) do fornecedor.

## Estrutura

```
OpenMeteo/
├── OpenMeteo.test.js   # Integração real (forecast, archive, air quality)
└── README.md           # Esta documentação
```

## Executar

```bash
npm test -- src/__tests__/OpenMeteo/OpenMeteo.test.js
```

Com verbose:

```bash
npm test -- --verbose src/__tests__/OpenMeteo/OpenMeteo.test.js
```

## Pré-requisitos

- Rede que consiga resolver e contactar os domínios Open-Meteo.
- Opcional: ficheiro `.env` na raiz do projeto (este ficheiro de teste **não** exige `MONGODB_URI`).

## O que é coberto

| Área | Descrição |
|------|-----------|
| `getForecast` | Previsão real; eco de coordenadas + campos típicos (`generationtime_ms`, `utc_offset_seconds`). |
| `getArchive` | Arquivo real com `daily.time` e `temperature_2m_max`. |
| `getAirQuality` | Resposta real da API de qualidade do ar. |
| `parseExpressQuery` | Arrays → string de parâmetros Open-Meteo, validado com **um `getForecast` real** em seguida. |

## Rotas REST no backend

O módulo expõe proxy on-demand em `/api/meteo` (ver `OpenMeteoRoutes.ts`):

- `GET /api/meteo/forecast?latitude=…&longitude=…`
- `GET /api/meteo/archive?latitude=…&longitude=…&start_date=…&end_date=…`
- `GET /api/meteo/air-quality?latitude=…&longitude=…`

Estes testes exercitam o **serviço** TypeScript; testes E2E contra Express podem ser acrescentados à parte se precisares.

## Referências

- Documentação: [https://open-meteo.com/en/docs](https://open-meteo.com/en/docs)
- Código: `src/infrastructure/apis/OpenMeteo/`
- Catálogo de fontes: `FONTES.md` (secção Open-Meteo)
