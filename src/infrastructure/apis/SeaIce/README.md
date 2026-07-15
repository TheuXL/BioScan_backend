

---

# API SeaIce (NSIDC)

O módulo **SeaIce** integra o backend do **BioScan** ao **NSIDC (National Snow and Ice Data Center)**, permitindo consultar dados em tempo real sobre a extensão do gelo marinho, concentração polar e cobertura de neve diretamente dos GeoServers oficiais da NASA/NOAA.

O módulo atua como um **proxy HTTP** para os serviços **WMS/WFS** do NSIDC, convertendo polígonos complexos em pontos normalizados para o módulo **Globe**.

---



## Fonte dos dados


| Item         | Valor                                                                                  |
| ------------ | -------------------------------------------------------------------------------------- |
| Provedor     | NSIDC Atlas of the Cryosphere                                                          |
| Organização  | NASA / NOAA                                                                            |
| GeoServer    | [https://nsidc.org/cgi-bin/atlas_north](https://nsidc.org/cgi-bin/atlas_north)         |
| Documentação | [NSIDC Programmatic Access](https://nsidc.org/data/user-resources/programmatic-access) |
| Licença      | Domínio Público / Dados de Satélite NASA                                               |
| API Key      | Não necessária (Acesso Aberto)                                                         |


---



## Funcionalidades

O módulo oferece:

- **Proxy HTTP** para serviços OGC (WMS e WFS);
- **Descoberta Dinâmica**: Consulta de metadados via `GetCapabilities`;
- **Dados Vetoriais**: Extração de polígonos de gelo em formato GeoJSON (`GetFeature`);
- **Resolução de Aliases**: Mapeamento de nomes amigáveis para camadas técnicas (ex: `extent-north`);
- **Cache Resiliente**: Persistência em MongoDB com suporte a Fallback em caso de queda do servidor da NASA;
- **Normalização Planetária**: Conversão de polígonos para o contrato `PontoGloboV1` com cálculo de centróide.

---



## Estrutura do Módulo

```text
SeaIce/
├── SeaIceController.ts      # Gerencia as requisições Express e fluxo de cache
├── SeaIceMiddleware.ts      # Validações de BBox, camadas e tipos de dados
├── SeaIceProxyCacheConfig.ts # Configurações de TTL e reconciliação com MongoDB
├── SeaIceRoutes.ts          # Definição dos endpoints REST
├── SeaIceService.ts         # Comunicação Axios com o GeoServer do NSIDC
├── SeaIceTypes.ts           # Definição de URLs, Aliases de camadas e Timeouts
└── README.md                # Esta documentação
```

---



## Configuração

A configuração é centralizada em `SeaIceTypes.ts`, definindo:

- **Camada Padrão**: `NSIDC:sea_ice_index_north_extent_polygons`;
- **Aliases Suportados**: `extent-north`, `extent-south`, `masie`, `concentration`;
- **Sistemas de Coordenadas**: Focado em `EPSG:4326` (WGS84);
- **Filtro Espacial Padrão**: Focado no Círculo Polar Ártico (`bbox=-180,60,180,90`).

---



## Operações Suportadas

O `SeaIceService` utiliza o protocolo **Web Feature Service (WFS)** para garantir dados editáveis:

### GetCapabilities

Retorna o XML oficial do NSIDC listando todas as variáveis criosféricas disponíveis.

### GetFeature (GeoJSON)

Solicita as feições geográficas filtradas. O módulo garante que a resposta seja sempre `application/json` para o frontend.

---



## Rotas da API


| Método | Endpoint                             | Descrição                                 |
| ------ | ------------------------------------ | ----------------------------------------- |
| GET    | `/api/sea-ice`                       | Metadados do módulo e camadas disponíveis |
| GET    | `/api/sea-ice/capabilities`          | XML bruto do servidor NSIDC               |
| GET    | `/api/sea-ice/layers/:layer/geojson` | GeoJSON bruto da camada solicitada        |


---



## Integração com o Globe

O módulo alimenta o motor 3D do BioScan através do endpoint:

```text
GET /api/globe/sea-ice
```

Cada massa de gelo (polígono) é convertida para:

```ts
{
  lat: number,          // Centro geográfico do gelo
  lon: number,          // Centro geográfico do gelo
  tipo: "sea_ice",
  origem: "NSIDC Sea Ice Index",
  momento: string,      // Data da observação via satélite
  severidade: number,   // Área total em km² (area_km2)
  titulo: "Sea Ice Extent",
  detalhes: { ... }     // Perímetro, área e dados brutos do sensor
}
```

---



## Cache e Resiliência

Para lidar com instabilidades nos servidores da NASA, o módulo utiliza o sistema de reconciliação de cache do BioScan.

### Variáveis de ambiente (.env)


| Variável                           | Valor padrão       |
| ---------------------------------- | ------------------ |
| `SEAICE_PROXY_RECONCILIATION_MODE` | `hybrid_ttl`       |
| `SEAICE_PROXY_TTL_SEC`             | `86400` (24 horas) |


Se o servidor do NSIDC falhar, o sistema responde automaticamente com dados do cache e injeta o cabeçalho:
`X-BioScan-Fallback: true`

---



## Exemplos de Uso



### Consultar Gelo no Ártico (JSON)

```bash
curl "http://localhost:3000/api/sea-ice/layers/extent-north/geojson"
```



### Consultar Dados Normalizados para o Mapa

```bash
curl "http://localhost:3000/api/globe/sea-ice?limit=100"
```

---



## Observações Técnicas

- **Cálculo de Centróide**: Essencial para transformar grandes polígonos de gelo em pontos leves para o mapa;
- **User-Agent**: As requisições são identificadas como `BioScan-Backend` para evitar rate-limiting abusivo;
- **Projeções**: Converte dinamicamente projeções polares (EASE-Grid) para WGS84.

---

**Autor:** Equipe de Engenharia BioScan  
**Versão:** 1.0.0 (Integração Criosférica)