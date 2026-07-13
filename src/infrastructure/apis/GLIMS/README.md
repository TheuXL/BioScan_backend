# API GLIMS

O módulo **GLIMS** integra o backend do **BioScan** ao **GLIMS (Global Land Ice Measurements from Space)**, permitindo consultar dados públicos de geleiras diretamente do GeoServer oficial.

O módulo atua como um **proxy HTTP** para os serviços **WMS/WFS** do GLIMS, preservando o formato original das respostas GeoJSON e disponibilizando uma versão normalizada para o módulo **Globe**.

---

## Fonte dos dados

| Item | Valor |
|------|-------|
| Provedor | GLIMS Glacier Database |
| Organização | National Snow and Ice Data Center (NSIDC) |
| GeoServer | https://www.glims.org/geoserver/ows |
| Documentação | https://www.glims.org/glacierdata/ |
| Licença | https://nsidc.org/about/data-use-and-copyright |
| API Key | Não necessária |

---

## Funcionalidades

O módulo oferece:

- proxy para serviços WMS e WFS do GLIMS;
- consulta de metadados (`GetCapabilities`);
- consulta GeoJSON (`GetFeature`);
- resolução automática de aliases de camadas;
- cache proxy opcional em MongoDB;
- fallback automático utilizando o cache;
- integração com o módulo Globe;
- normalização das geometrias para o contrato `PontoGloboV1`.

---

## Estrutura

```text
GLIMS/
├── GlimsController.ts
├── GlimsMiddleware.ts
├── GlimsProxyCacheConfig.ts
├── GlimsRoutes.ts
├── GlimsService.ts
├── GlimsTypes.ts
└── README.md
```

---

## Configuração

A configuração do módulo é centralizada em `GlimsTypes.ts`, onde são definidos:

- URL do GeoServer;
- timeout das chamadas HTTP;
- camada padrão;
- aliases de camadas;
- sistema de coordenadas padrão (`EPSG:4326`);
- valores padrão utilizados pelo proxy.

---

## Operações suportadas

O `GlimsService` utiliza **Axios** para comunicação com o GeoServer.

### WMS

Consulta de metadados utilizando:

```
GetCapabilities
```

Retorna o XML original produzido pelo GLIMS.

### WFS

Consulta de feições utilizando:

```
GetFeature
```

Retorna o GeoJSON original produzido pelo GLIMS.

---

## Rotas

| Método | Endpoint | Descrição |
|---------|----------|-----------|
| GET | `/api/glaciers` | Informações do módulo |
| GET | `/api/glaciers/capabilities` | XML do `GetCapabilities` |
| GET | `/api/glaciers/layers/:layer/geojson` | GeoJSON de uma camada |

---

## Integração com o Globe

Além das rotas próprias do módulo, o GLIMS fornece dados para o módulo **Globe**.

O endpoint

```
GET /api/globe/geleiras
```

utiliza internamente o `GlimsService` para consultar o GeoServer e converter cada *Feature* para o contrato comum `PontoGloboV1`.

Cada geleira é representada como:

```ts
{
  lat,
  lon,
  tipo: "geleira",
  origem: "GLIMS",
  idFonte,
  titulo,
  momento: null,
  severidade: null,
  detalhes
}
```

Esse formato é compartilhado com as demais camadas do Globe (incêndios, sismos, espécies ameaçadas e lixo marinho), permitindo que todas sejam renderizadas utilizando o mesmo componente de mapa.

---

## Fluxo da consulta

```text
Cliente
    │
    ▼
Express Router
    │
    ▼
GlimsController
    │
    ▼
GlimsService
    │
    ▼
GeoServer GLIMS
    │
    ▼
GeoJSON
    │
    ▼
Proxy Cache (opcional)
    │
    ▼
Resposta HTTP
```

---

## Cache Proxy

O módulo utiliza a mesma infraestrutura de cache proxy empregada pelos demais provedores do BioScan.

Quando o MongoDB está habilitado, as respostas podem ser armazenadas para reduzir chamadas repetidas ao serviço GLIMS e servir como fallback caso o GeoServer fique indisponível.

### Variáveis de ambiente

| Variável | Valor padrão |
|-----------|--------------|
| `GLIMS_PROXY_RECONCILIATION_MODE` | `hybrid_ttl` |
| `GLIMS_PROXY_TTL_SEC` | `3600` |

### Escopos armazenados

| Escopo | Conteúdo |
|---------|----------|
| `glims.capabilities` | XML retornado por `GetCapabilities` |
| `glims.layer_geojson` | GeoJSON retornado por `GetFeature` |

Quando ocorre fallback, a resposta recebe automaticamente:

```json
{
  "bioscan_meta": {
    "fromBioScanCache": true
  }
}
```

Caso não exista cache disponível, o módulo responde com **HTTP 502 (Bad Gateway)**.

---

## Exemplos de uso

### Informações do módulo

```bash
curl http://localhost:3000/api/glaciers
```

Resposta:

```json
{
  "provider": "BioScan proxy — GLIMS glacier data",
  "basePath": "/api/glaciers",
  "defaultLayer": "GLIMS:GLIMS_Glacier_Outlines",
  "requiresApiKey": false
}
```

### GetCapabilities

```bash
curl http://localhost:3000/api/glaciers/capabilities
```

Retorna o XML original produzido pelo GLIMS.

### GeoJSON

```bash
curl "http://localhost:3000/api/glaciers/layers/outlines/geojson"
```

### GeoJSON com limite

```bash
curl "http://localhost:3000/api/glaciers/layers/outlines/geojson?feature_count=500"
```

### GeoJSON com Bounding Box

```bash
curl "http://localhost:3000/api/glaciers/layers/outlines/geojson?bbox=-74,-56,-32,13"
```

### Integração com o Globe

```bash
curl http://localhost:3000/api/globe/geleiras
```

---

## Como testar

Executar os testes do módulo:

```bash
npm test -- Glims.test.js
```

ou

```bash
npm.cmd test -- Glims.test.js
```

Iniciar o backend:

```bash
npm run dev
```

ou

```bash
npm.cmd run dev
```

Depois acesse:

```
GET /api/glaciers
GET /api/glaciers/capabilities
GET /api/glaciers/layers/outlines/geojson
GET /api/globe/geleiras
```

---

## Tratamento de erros

| Situação | Resposta |
|----------|----------|
| GeoServer indisponível | HTTP 502 |
| Camada inválida | HTTP 400 |
| Bounding Box inválido | HTTP 400 |
| `feature_count` inválido | HTTP 400 |

Quando existe cache válido, o módulo retorna o último payload conhecido em vez de falhar imediatamente.

---

## Dependências

O módulo utiliza apenas bibliotecas já presentes no backend.

- Express
- Axios
- MongoDB (cache opcional)
- TypeScript

---

## Observações técnicas

- módulo stateless;
- consultas realizadas sob demanda;
- não sincroniza dados permanentemente;
- MongoDB opcional;
- cache utilizado apenas para fallback;
- preserva integralmente o GeoJSON retornado pelo GLIMS;
- sistema de coordenadas padrão `EPSG:4326`;
- timeout HTTP configurável em `GlimsTypes.ts`;
- não requer autenticação nem API Key.

---

## Melhorias futuras

### Testes

- ampliar a cobertura do módulo;
- testar fallback do cache;
- testar aliases de camadas;
- testar timeout do GeoServer;
- testar parâmetros inválidos.

### Funcionalidades

- suporte a filtros WFS (`propertyName`, `sortBy`, `startIndex` e `count`);
- suporte a novas camadas disponibilizadas pelo GLIMS;
- compressão `gzip` e `brotli` para respostas GeoJSON grandes;
- métricas de monitoramento;
- documentação completa no OpenAPI.

---

## Referências

- GLIMS Glacier Database — https://www.glims.org/
- GLIMS Documentation — https://www.glims.org/glacierdata/
- GeoServer Documentation — https://docs.geoserver.org/
- OGC Web Feature Service — https://www.ogc.org/standards/wfs
- National Snow and Ice Data Center — https://nsidc.org/

---

## Histórico

### v1.0

- integração com o GLIMS;
- suporte aos serviços WMS e WFS;
- endpoint `GetCapabilities`;
- endpoint GeoJSON;
- aliases de camadas;
- cache proxy opcional;
- fallback utilizando MongoDB;
- integração com o Globe (`/api/globe/geleiras`);
- normalização para `PontoGloboV1`.

---

## Autor

Desenvolvido como parte do **BioScan**, plataforma para integração de dados ambientais provenientes de múltiplas fontes públicas.

O módulo segue o mesmo padrão arquitetural utilizado pelos demais provedores externos do projeto, facilitando a manutenção, a reutilização de componentes e futuras expansões.