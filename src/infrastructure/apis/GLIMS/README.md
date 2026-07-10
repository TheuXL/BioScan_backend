# GLIMS (geleiras)

Módulo TypeScript alinhado à arquitetura do backend: Service / Controller / Routes / Types. Este módulo expõe um proxy on-demand para dados de geleiras do GLIMS, sem necessidade de chave de API.

## O que faz

O módulo BioScan integra o catálogo e os serviços WMS/WFS do GLIMS para disponibilizar dados geoespaciais de geleiras por meio de rotas REST no backend.

Ele cobre principalmente:

- contornos de geleiras
- camadas RGI e RGI70
- visualização de geleiras extintas
- consulta GeoJSON por camada e bounding box

## Estrutura

```
GLIMS/
├── GlimsController.ts   # Respostas HTTP e normalização das respostas
├── GlimsRoutes.ts       # Montagem em /api/glaciers
├── GlimsService.ts      # Chamadas ao WMS/WFS do GLIMS
├── GlimsTypes.ts        # URLs, defaults, aliases de camadas
└── README.md
```

## Fonte

- **Provedor:** [GLIMS Glacier Database](https://www.glims.org/glacierdata/)
- **Serviços usados:** WMS/WFS do GLIMS em `https://www.glims.org/geoserver/ows`
- **Termos e uso:** [NSIDC data use and copyright](https://nsidc.org/about/data-use-and-copyright)
- **Autenticação:** não exige chave; acesso público via proxy do backend

## Rotas (`/api/glaciers`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/` | Retorna informações do módulo, base path, endpoints e camadas disponíveis. |
| `GET` | `/capabilities` | Consulta o endpoint de capabilities do WMS do GLIMS. |
| `GET` | `/layers/:layerName/geojson` | Consulta GeoJSON de uma camada de geleira via WFS. |

## Camadas suportadas

O módulo aceita aliases simples para facilitar o uso:

| Alias | Camada upstream |
|-------|-----------------|
| `outlines` | `GLIMS:GLIMS_Glacier_Outlines` |
| `rgi` | `GLIMS:RGI` |
| `rgi70` | `GLIMS:RGI70` |
| `extinct` | `GLIMS:extinct_glaciers_view` |

## Parâmetros da rota GeoJSON

A rota `/layers/:layerName/geojson` aceita parâmetros opcionais:

- `bbox`: bounding box da consulta
- `width`: largura da imagem de referência
- `height`: altura da imagem de referência
- `srs`: sistema de referência espacial
- `cql_filter`: filtro CQL
- `feature_count`: limite de features retornadas

Valores padrão estão definidos em `GlimsTypes.ts`.

## Integração no servidor

O módulo é registrado em `src/index.js` sob o prefixo:

- `/api/glaciers`

A montagem é feita diretamente pelo `createGlimsRoutes`, sem depender de MongoDB ou de chave externa.

## Exemplos de uso

### Informações do módulo

```bash
curl http://localhost:3000/api/glaciers
```

### Capabilities do GLIMS

```bash
curl http://localhost:3000/api/glaciers/capabilities
```

### GeoJSON de uma camada de geleiras

```bash
curl "http://localhost:3000/api/glaciers/layers/outlines/geojson?bbox=-180,-90,180,90&feature_count=50"
```

## Observações

- Este módulo é específico para dados de geleiras e não cobre outros domínios do backend.
- Erros na consulta upstream retornam resposta HTTP 502 com detalhe do erro.
- O serviço é um proxy on-demand, portanto depende da disponibilidade do upstream do GLIMS.

## Referências

- Catálogo de fontes: `FONTES.md`
- Arquitetura geral: `Arquitetura.md`
