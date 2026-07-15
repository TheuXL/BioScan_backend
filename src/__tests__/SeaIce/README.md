# Testes — Sea Ice (`SeaIce`)

Integração real com [NSIDC Atlas of the Cryosphere](https://nsidc.org/home).

## Descoberta e Metadados

- `getInfo` — retorna informações do provedor, base path e camadas suportadas (`extent-north`, `masie`, etc).
- `getCapabilities` — proxy para o XML original do NSIDC. Deve retornar `Content-Type: application/xml`.

## GeoJSON e Validação (`Middlewares`)

- **Camadas** — Resolução de aliases (ex: `extent-north` mapeia para a camada técnica da NASA). Rejeição de camadas inexistentes (400).
- **Bounding Box (**`bbox`**)** — Validação de coordenadas geográficas. Falha com **400** se a longitude estiver fora de [-180, 180] ou latitude fora de [-90, 90].
- **Contagem de Feições** — Limita o `feature_count` ao máximo permitido no `SeaIceTypes.ts`.



## Serviço e Resiliência

- `SeaIceService` — Verificação via mocks do `axios` para garantir que o alvo é o GeoServer da `nsidc.org` e que os parâmetros WFS (`GetFeature`, `outputFormat: application/json`) estão corretos.
- **Tratamento de Erro (502)** — Simulação de queda no servidor da NASA. O controlador deve retornar **502 (Bad Gateway)** caso o serviço esteja indisponível e não haja cache no MongoDB.



## Executar

```bash
npm test -- src/__tests__/SeaIce/SeaIce.test.js
```

Rotas: `src/infrastructure/apis/SeaIce/` e `/api/sea-ice`.
Normalização para o Globe: `src/infrastructure/apis/Globe/GlobeNormalization.ts`.