# NASA Fire API Module

Módulo completo para integração com a **NASA FIRMS** (Fire Information for Resource Management System) API, que fornece dados de focos de incêndio em tempo real detectados por satélites.

## 📚 Índice

- [Sobre o NASA FIRMS](#sobre-o-nasa-firms)
- [Obtenção da Chave API](#obtenção-da-chave-api)
- [Fontes de Dados](#fontes-de-dados)
- [Estrutura do Módulo](#estrutura-do-módulo)
- [Componentes](#componentes)
- [Endpoints da API](#endpoints-da-api)
- [Uso e Exemplos](#uso-e-exemplos)
- [Limitações e Considerações](#limitações-e-considerações)
- [Referências](#referências)

---

## 🔥 Sobre o NASA FIRMS

O **FIRMS** (Fire Information for Resource Management System) é um sistema da NASA que fornece dados de focos de incêndio ativos detectados por sensores de satélite em **tempo quase real** (NRT - Near Real-Time).

### O que são os dados?

- **Active Fire (Focos Ativos):** Anomalias térmicas detectadas no momento da passagem do satélite
- Cada ponto representa o **centro de um pixel** onde foi detectado fogo
- Resolução espacial:
  - **MODIS:** ~1km por pixel
  - **VIIRS:** ~375m ou 750m por pixel (mais detalhado)

### Diferença entre Active Fire e Burned Area

- **Active Fire (NRT):** Focos detectados em tempo quase real - **é o que esta API fornece**
- **Burned Area:** Produto de pós-fogo que mapeia a extensão total da cicatriz mensalmente (não disponível via esta API)

---

## 🔑 Obtenção da Chave API

Para utilizar a API do NASA FIRMS, você precisa de uma **MAP_KEY** (chave de autenticação):

1. Acesse: [firms.modaps.eosdis.nasa.gov/api/map_key/](https://firms.modaps.eosdis.nasa.gov/api/map_key/)
2. Preencha o formulário com:
   - Seu e-mail
   - Finalidade do uso
3. Você receberá a **MAP_KEY** por e-mail
4. Configure no arquivo `.env`:
   ```env
   MAP_KEY=sua_chave_aqui
   ```

### Limites de Uso

- **Gratuito** para uso não comercial
- Sujeito a **rate limiting** (limites de requisições por minuto)
- Típico: ~500 requisições por minuto (depende do tipo de chave)

---

## 🛰️ Fontes de Dados

O módulo suporta três fontes de dados de satélite:

### 1. MODIS_NRT
- **Satélites:** Terra e Aqua
- **Resolução:** ~1km por pixel
- **Cobertura:** Global, 2-4 passagens por dia
- **Uso:** Ideal para monitoramento de grandes áreas

### 2. VIIRS_SNPP_NRT
- **Satélite:** Suomi NPP (S-NPP)
- **Resolução:** ~375m por pixel
- **Cobertura:** Global, melhor detecção de pequenos focos
- **Uso:** Ideal para detecção de incêndios menores e mais precisos

### 3. VIIRS_NOAA20_NRT
- **Satélite:** NOAA-20 (JPSS-1)
- **Resolução:** ~375m por pixel
- **Cobertura:** Global, complementa o S-NPP
- **Uso:** Maior cobertura temporal combinando com S-NPP

### Qual escolher?

- **MODIS:** Para monitoramento geral e grandes incêndios
- **VIIRS:** Para detecção mais precisa e pequenos focos (recomendado)

---

## 📁 Estrutura do Módulo

```
NasaFire/
├── NasaFireTypes.ts         # Tipos TypeScript e constantes
├── NasaFireService.ts       # Lógica de negócio e sincronização
├── NasaFireController.ts    # Controllers HTTP
├── NasaFireRoutes.ts        # Definição de rotas
├── NasaFireModels.ts        # Modelos MongoDB
├── NasaFireMiddleware.ts    # Middlewares de validação
└── README.md                # Esta documentação
```

---

## 🧩 Componentes

### NasaFireTypes.ts

Define tipos TypeScript, enums e constantes:

```typescript
// Enum de fontes de dados
enum FireSource {
  MODIS_NRT = 'MODIS_NRT',
  VIIRS_SNPP_NRT = 'VIIRS_SNPP_NRT',
  VIIRS_NOAA20_NRT = 'VIIRS_NOAA20_NRT'
}

// Interface dos dados de fogo
interface FireData {
  latitude: number;
  longitude: number;
  brightness?: number;
  acq_date: string;
  acq_time?: string;
  confidence?: string;
  frp?: number;  // Fire Radiative Power
  daynight?: 'D' | 'N';
  // ... outros campos
}
```

### NasaFireService.ts

Serviço principal que contém:

- **Cliente da API NASA FIRMS**
- **Lógica de sincronização automática** (cron job)
- **Métodos para buscar dados:**
  - `getActiveFires()` - Busca incêndios globais
  - `getActiveFiresByCountry()` - Busca por país
  - `syncFireData()` - Sincroniza dados para MongoDB
  - `startSync()` - Inicia sincronização automática
  - `stopSync()` - Para sincronização
  - `getSyncStatus()` - Retorna status do serviço

### NasaFireController.ts

Controllers HTTP que processam requisições:

- `getFires()` - Lista incêndios do MongoDB
- `getFiresByCountry()` - Busca incêndios por país
- `getSyncStatus()` - Status do serviço de sync
- `triggerSync()` - Força sincronização manual

### NasaFireRoutes.ts

Define todas as rotas da API REST:

- `GET /api/fires` - Lista incêndios
- `GET /api/fires/by-country` - Incêndios por país
- `GET /api/fires/sync-status` - Status do sync
- `POST /api/fires/sync` - Sincronização manual

### NasaFireModels.ts

Modelo Mongoose para armazenar dados na collection `nasa_fire`:

- Schema com todos os campos da API
- Índices para consultas eficientes
- Prevenção de duplicatas via `fireId` único

### NasaFireMiddleware.ts

Middlewares de validação:

- `validateSource` - Valida fonte de dados
- `validateDays` - Valida número de dias (1-10)
- `validateCountryCode` - Valida código ISO do país
- `validateLimit` - Valida limite de resultados
- `validateDates` - Valida formato de datas

---

## 🌐 Endpoints da API

### GET /api/fires

Lista incêndios do banco de dados MongoDB (dados sincronizados).

**Query Parameters:**
- `limit` (opcional) - Número máximo de resultados (padrão: 1000, máx: 10000)
- `source` (opcional) - Fonte de dados (`MODIS_NRT`, `VIIRS_SNPP_NRT`, `VIIRS_NOAA20_NRT`)
- `startDate` (opcional) - Data inicial no formato `YYYY-MM-DD`
- `endDate` (opcional) - Data final no formato `YYYY-MM-DD`

**Exemplo:**
```bash
GET /api/fires?limit=500&source=VIIRS_SNPP_NRT&startDate=2024-01-15
```

**Resposta:**
```json
{
  "count": 500,
  "data": [
    {
      "latitude": -23.456,
      "longitude": -46.789,
      "brightness": 320.5,
      "acq_date": "2024-01-15",
      "acq_time": "1430",
      "confidence": "high",
      "frp": 15.2,
      "daynight": "D",
      "source": "VIIRS_SNPP_NRT",
      "fireId": "-23.456_-46.789_2024-01-15_1430_VIIRS_SNPP_NRT"
    }
  ]
}
```

### GET /api/fires/by-country

Busca incêndios por código de país diretamente da API NASA (não do banco).

**Query Parameters:**
- `countryCode` (obrigatório) - Código ISO 3166-1 alpha-3 (ex: `BRA`, `USA`, `CAN`)
- `source` (opcional) - Fonte de dados (padrão: `MODIS_NRT`)
- `days` (opcional) - Número de dias atrás (1-10, padrão: 1)

**Exemplo:**
```bash
GET /api/fires/by-country?countryCode=BRA&source=VIIRS_SNPP_NRT&days=1
```

**Resposta:**
```json
{
  "count": 150,
  "data": [
    {
      "latitude": -15.123,
      "longitude": -47.890,
      "acq_date": "2024-01-15",
      "confidence": "high",
      "frp": 22.5
    }
  ]
}
```

### GET /api/fires/sync-status

Retorna o status do serviço de sincronização automática.

**Resposta:**
```json
{
  "isRunning": true,
  "lastSyncTime": "2024-01-15T14:30:00.000Z",
  "interval": "*/1 * * * *"
}
```

### POST /api/fires/sync

Força uma sincronização manual dos dados (útil para testes).

**Body (opcional):**
```json
{
  "source": "MODIS_NRT"
}
```

**Resposta:**
```json
{
  "message": "Sync completed",
  "saved": 150,
  "skipped": 50,
  "errors": 0
}
```

---

## 💻 Uso e Exemplos

### Inicialização no index.js

```typescript
import { NasaFireService } from './infrastructure/apis/NASA/NasaFire/NasaFireService';
import { createNasaFireRoutes } from './infrastructure/apis/NASA/NasaFire/NasaFireRoutes';
import express from 'express';

const app = express();

// Criar instância do serviço
const nasaFireService = new NasaFireService({ 
  apiKey: process.env.MAP_KEY 
});

// Iniciar sincronização automática (a cada minuto)
nasaFireService.startSync();

// Configurar rotas
const router = express.Router();
app.use('/api/fires', createNasaFireRoutes(router, nasaFireService));

// Armazenar serviço para acesso em outros lugares
app.locals.nasaFireService = nasaFireService;
```

### Uso do Service diretamente

```typescript
import { NasaFireService } from './NasaFireService';
import { FireSource } from './NasaFireTypes';

const service = new NasaFireService({ apiKey: 'sua_chave' });

// Buscar incêndios globais
const fires = await service.getActiveFires({
  source: FireSource.VIIRS_SNPP_NRT,
  days: 1,
  bbox: '-180,-90,180,90' // Global
});

// Buscar por país
const brazilFires = await service.getActiveFiresByCountry({
  countryCode: 'BRA',
  source: FireSource.VIIRS_SNPP_NRT,
  days: 1
});

// Sincronizar dados manualmente
const result = await service.syncFireData(FireSource.MODIS_NRT);
console.log(`Salvos: ${result.saved}, Ignorados: ${result.skipped}`);
```

### Consultas no MongoDB

```typescript
import { NasaFireModel } from './NasaFireModels';

// Buscar incêndios recentes
const recentFires = await NasaFireModel.find({
  acq_date: { $gte: '2024-01-15' }
})
.sort({ acq_date: -1 })
.limit(100);

// Buscar por região (bounding box)
const regionFires = await NasaFireModel.find({
  latitude: { $gte: -25, $lte: -20 },
  longitude: { $gte: -50, $lte: -45 }
});

// Buscar apenas alta confiança
const highConfidence = await NasaFireModel.find({
  confidence: 'high',
  source: 'VIIRS_SNPP_NRT'
});
```

---

## ⚠️ Limitações e Considerações

### 1. Nuvens

- **Problema:** Sensores não conseguem "ver" através de nuvens espessas
- **Impacto:** Se uma região estiver nublada, a API não reportará focos, mesmo que o incêndio continue
- **Solução:** Considere múltiplas passagens do satélite ou combine com outras fontes

### 2. Confiança dos Dados

- **Campo `confidence`:** Indica a confiabilidade da detecção
- **Valores:** `low`, `nominal`, `high`
- **Recomendação:** Filtre focos com baixa confiança para evitar falsos positivos causados por:
  - Reflexos solares
  - Superfícies metálicas
  - Outras anomalias térmicas

**Exemplo de filtro:**
```typescript
const reliableFires = await NasaFireModel.find({
  confidence: { $in: ['nominal', 'high'] }
});
```

### 3. Resolução Espacial

- **MODIS:** ~1km - pode detectar apenas incêndios maiores
- **VIIRS:** ~375m - detecta incêndios menores, mas pode ter mais falsos positivos
- **Recomendação:** Use VIIRS para maior precisão, mas valide com dados adicionais

### 4. Cobertura Temporal

- **Passagens:** 2-4 vezes por dia (depende do satélite)
- **Latência:** Dados disponíveis em ~3 horas após detecção
- **Gap temporal:** Pode haver períodos sem cobertura em algumas regiões

### 5. Rate Limiting

- **Limite:** ~500 requisições por minuto (depende da chave)
- **Solução:** O módulo implementa sincronização automática para evitar múltiplas requisições desnecessárias

### 6. Dados Históricos

- **Limite:** Máximo de 10 dias de histórico via API
- **Para dados mais antigos:** Use o download direto do site FIRMS

### 7. Precisão Geográfica

- **Coordenadas:** Representam o centro do pixel detectado
- **Erro:** Pode variar até metade da resolução do pixel
- **MODIS:** ±500m
- **VIIRS:** ±187m

---

## 📊 Estrutura de Dados

### FireData (Interface TypeScript)

```typescript
interface FireData {
  latitude: number;           // Latitude do centro do pixel
  longitude: number;         // Longitude do centro do pixel
  brightness?: number;        // Temperatura de brilho (Kelvin)
  scan?: number;              // Largura do pixel (km)
  track?: number;             // Altura do pixel (km)
  acq_date: string;           // Data de aquisição (YYYY-MM-DD)
  acq_time?: string;          // Hora de aquisição (HHMM)
  satellite?: string;         // Nome do satélite
  instrument?: string;        // Instrumento usado
  confidence?: string;        // Nível de confiança (low/nominal/high)
  version?: string;           // Versão do algoritmo
  bright_t31?: number;        // Temperatura no canal 31 (Kelvin)
  frp?: number;               // Fire Radiative Power (MW)
  daynight?: 'D' | 'N';      // Dia (D) ou Noite (N)
}
```

### Documento no MongoDB

Os dados são armazenados na collection `nasa_fire` com campos adicionais:

```typescript
{
  // Campos da API acima
  source: FireSource;         // Fonte de dados usada
  fireId: string;             // ID único para prevenir duplicatas
  createdAt: Date;            // Data de criação no banco
  updatedAt: Date;            // Data de atualização
}
```

---

## 🔄 Sincronização Automática

O módulo implementa sincronização automática que:

1. **Executa a cada minuto** (configurável)
2. **Busca dados globais** das últimas 24 horas
3. **Salva no MongoDB** evitando duplicatas
4. **Registra logs** de progresso (salvos, ignorados, erros)

### Configuração

```typescript
// Intervalo padrão: a cada minuto
service.startSync();

// Intervalo customizado (cron expression)
service.startSync('*/5 * * * *'); // A cada 5 minutos
service.startSync('0 */6 * * *'); // A cada 6 horas
```

### Status da Sincronização

```typescript
const status = service.getSyncStatus();
// {
//   isRunning: true,
//   lastSyncTime: Date,
//   interval: string
// }
```

---

## 📖 Referências

### Documentação Oficial

- **NASA FIRMS:** [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov)
- **API Documentation:** [firms.modaps.eosdis.nasa.gov/api/](https://firms.modaps.eosdis.nasa.gov/api/)
- **Solicitar Chave:** [firms.modaps.eosdis.nasa.gov/api/map_key/](https://firms.modaps.eosdis.nasa.gov/api/map_key/)

### Manuais Técnicos

- **MODIS Collection 6 Fire User Guide:** Guia completo sobre detecção de focos ativos pelo MODIS
- **VIIRS C2 BA User Guide v1.1:** Guia sobre produtos de área queimada do VIIRS

### Conceitos Importantes

- **Active Fire vs Burned Area:** Esta API fornece apenas Active Fire (tempo quase real)
- **NRT (Near Real-Time):** Dados disponíveis em ~3 horas após detecção
- **FRP (Fire Radiative Power):** Medida da intensidade do fogo em MW

---

## 🚀 Próximos Passos

1. **Filtros Avançados:** Implementar filtros por confiança, FRP mínimo, etc.
2. **Alertas:** Sistema de notificações quando novos focos são detectados
3. **Análise Temporal:** Agregação de dados por período
4. **Visualização:** Endpoints para mapas e visualizações geoespaciais
5. **Cache:** Implementar cache para reduzir requisições à API

---

## 📝 Notas de Desenvolvimento

- O módulo usa **TypeScript** para type safety
- Dados são armazenados na collection **`nasa_fire`** do MongoDB
- Sincronização automática usa **node-cron**
- Validações são feitas via **middlewares** antes de processar requisições
- Prevenção de duplicatas via campo **`fireId`** único

---

**Última atualização:** Janeiro 2024  
**Versão do módulo:** 1.0.0
