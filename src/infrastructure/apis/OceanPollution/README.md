# Poluição marinha / lixo — Ocean Pollution (EPA R9)

Proxy on-demand ao [ArcGIS REST da EPA (GISpub)](https://gispub.epa.gov/arcgis/rest/services/R9MarineDebris) — pasta **R9MarineDebris** (observações de lixo marinho, MapServer). **Sem chave API.**

## Rotas (`/api/ocean-pollution`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/` | Metadados BioScan + lista de `datasets` suportados |
| `GET` | `/epa-r9/:dataset/metadata` | `MapServer?f=pjson` (camadas, extensão) |
| `GET` | `/epa-r9/:dataset/layers/:layerId/geojson` | Query ArcGIS → GeoJSON (`where`, `limit` ou `resultRecordCount`, `outFields`) |

`dataset` tem de ser um dos valores em `EPA_R9_MARINE_DEBRIS_DATASETS` (`OceanPollutionTypes.ts`). Exemplo de camada com pontos: `ER1402150_MarineDebrisData` / layer `1`.

## Globo

Resposta **GeoJSON** (`FeatureCollection`) com `geometry.type === 'Point'` e propriedades da EPA — pronta para desenhar no cliente.

## Termos

Respeitar [privacidade / uso EPA](https://www.epa.gov/privacy) e carga razoável no serviço público (usar `limit` modesto).

## Legado

`MarineDebrisTracker/MarineDebrisTrackerApi.js` é placeholder antigo; usar este módulo.
