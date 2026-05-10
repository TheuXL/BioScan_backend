# NASA GISTEMP API Module

Módulo completo para integração com a **NASA GISTEMP** (Goddard Institute for Space Studies Surface Temperature Analysis), que fornece dados históricos de anomalias de temperatura global desde 1880.

## 📋 Índice

- [Sobre o NASA GISTEMP](#sobre-o-nasa-gistemp)
- [Fonte de Dados](#fonte-de-dados)
- [Estrutura do Módulo](#estrutura-do-módulo)
- [Componentes](#componentes)
- [Endpoints da API](#endpoints-da-api)
- [Uso](#uso)
- [Sincronização Automática](#sincronização-automática)
- [Limitações](#limitações)
- [Estrutura de Dados](#estrutura-de-dados)
- [Referências](#referências)

## 🌡️ Sobre o NASA GISTEMP

O **GISTEMP** (Goddard Institute for Space Studies Surface Temperature Analysis) é um sistema da NASA que fornece análises de temperatura superficial global baseadas em dados de estações meteorológicas e observações de temperatura da superfície do mar.

### Características Principais

- **Dados Históricos**: Séries temporais desde 1880
- **Atualização Mensal**: Dados atualizados mensalmente
- **Múltiplas Fontes**: Terra-Oceano, Terra Apenas, Oceano Apenas
- **Formato JSON**: Dados disponíveis em formato JSON fácil de consumir
- **Sem Autenticação**: Não requer API key (dados públicos)

## 📊 Fonte de Dados

### Documentação
```
https://data.giss.nasa.gov/gistemp/
```
### URL Base
```
https://data.giss.nasa.gov/gistemp
```

### Endpoints Disponíveis

1. **Anomalias Mensais Globais (Land-Ocean)**
   - URL: `https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.txt`
   - Descrição: Dados combinados de terra e oceano

2. **Terra Apenas**
   - URL: `https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts.txt`
   - Descrição: Apenas dados de estações terrestres

3. **Oceano Apenas**
   - URL: `https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.txt`
   - Descrição: Apenas dados de temperatura do oceano

### Formato dos Dados

O arquivo TXT retornado pela NASA usa formato de texto fixo (fixed-width):

```
Year   Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec    J-D D-N    DJF  MAM  JJA  SON  Year
1880   -19  -25  -10  -17  -11  -22  -19  -11  -15  -24  -23  -18    -18 ***   ****  -13  -17  -21  1880
1881   -20  -15    3    4    5  -19    0   -4  -16  -22  -19   -7     -9 -10    -18    4   -8  -19  1881
...
```

**Estrutura:**
- Cada linha representa um ano
- Primeira coluna: Ano (4 dígitos)
- Colunas seguintes: Valores mensais (Jan-Dec) em formato fixo
- Valores podem ser negativos, positivos, ou `*****` para dados faltantes
- **Nota**: Os valores são em escala 100x (ex: 120 = 1.2°C, -19 = -0.19°C)

## 📁 Estrutura do Módulo

```
NasaGistemp/
├── NasaGistempTypes.ts         # Tipos TypeScript e constantes
├── NasaGistempService.ts       # Lógica de negócio e sincronização
├── NasaGistempController.ts    # Controllers HTTP
├── NasaGistempRoutes.ts        # Definição de rotas
├── NasaGistempModels.ts        # Modelos MongoDB
├── NasaGistempMiddleware.ts    # Middlewares de validação
└── README.md                   # Esta documentação
```

## 🔧 Componentes

### NasaGistempTypes.ts

Define tipos TypeScript, enums e constantes:

- **StationType**: Enum para tipos de estações (Land-Ocean, Land-Only, Ocean-Only)
- **DEFAULTS**: Valores padrão
- **API_CONFIG**: Configuração da API
- **COLLECTION**: Nome da collection MongoDB
- **SYNC_CONFIG**: Configuração do serviço de sincronização
- **Interfaces**: TemperatureData, SyncResult, SyncStatus, etc.

### NasaGistempService.ts

Encapsula a lógica de negócio:

- **Cliente da API NASA GISTEMP** (formato TXT)
- **Parser de texto fixo** (`parseTemperatureData`) - processa formato TXT da NASA
- **Métodos para buscar dados** (`fetchTemperatureData`)
- **Métodos para sincronizar com MongoDB** (`syncTemperatureData`)
- **Métodos para consultar dados** (`getTemperatureData`)
- **Gerenciamento de cron job** para sincronização automática semanal

### NasaGistempController.ts

Handles HTTP requests and responses:

- `getTemperature()` - Lista dados de temperatura do MongoDB
- `getTemperatureStats()` - Estatísticas dos dados
- `getSyncStatus()` - Status do serviço de sincronização
- `triggerSync()` - Sincronização manual

### NasaGistempRoutes.ts

Define as rotas Express.js:

- `GET /api/global-temperature` - Lista dados de temperatura
- `GET /api/global-temperature/stats` - Estatísticas
- `GET /api/global-temperature/sync-status` - Status do sync
- `POST /api/global-temperature/sync` - Sincronização manual

### NasaGistempModels.ts

Modelo Mongoose para armazenar dados na collection `nasa_gistemp`:

- Schema com todos os campos necessários
- Índices para consultas eficientes
- Prevenção de duplicatas via índice único (year, month, stationType)

### NasaGistempMiddleware.ts

Middlewares de validação:

- `validateStationType` - Valida tipo de estação
- `validateYears` - Valida anos (1880 até atual)
- `validateMonth` - Valida mês (Jan-Dec)
- `validateStationTypeBody` - Valida tipo de estação no body

## 🛣️ Endpoints da API

### GET /api/global-temperature

Busca dados de temperatura do MongoDB.

**Query Parameters:**
- `startYear` (opcional): Ano inicial (ex: 1880)
- `endYear` (opcional): Ano final (ex: 2024)
- `stationType` (opcional): Tipo de estação (Land-Ocean, Land-Only, Ocean-Only)
- `month` (opcional): Mês específico (Jan, Feb, Mar, ..., Dec)

**Exemplo:**
```bash
GET /api/global-temperature?startYear=2000&endYear=2024&stationType=Land-Ocean
```

**Resposta:**
```json
{
  "count": 300,
  "data": [
    {
      "year": 2000,
      "month": "Jan",
      "anomaly": 0.72,
      "stationType": "Land-Ocean"
    },
    ...
  ]
}
```

### GET /api/global-temperature/stats

Retorna estatísticas dos dados de temperatura.

**Query Parameters:**
- `stationType` (opcional): Tipo de estação

**Resposta:**
```json
{
  "stationType": "Land-Ocean",
  "stats": {
    "minAnomaly": -0.45,
    "maxAnomaly": 1.12,
    "avgAnomaly": 0.35,
    "minYear": 1880,
    "maxYear": 2024,
    "totalRecords": 1728
  }
}
```

### GET /api/global-temperature/sync-status

Retorna o status do serviço de sincronização.

**Resposta:**
```json
{
  "isRunning": true,
  "lastSyncTime": "2024-01-15T10:30:00.000Z",
  "interval": "0 0 * * 0"
}
```

### POST /api/global-temperature/sync

Dispara uma sincronização manual dos dados.

**Body (opcional):**
```json
{
  "stationType": "Land-Ocean"
}
```

**Resposta:**
```json
{
  "message": "Temperature data sync completed.",
  "saved": 12,
  "updated": 5,
  "skipped": 0,
  "errors": 0
}
```

## 💻 Uso

### Integração no index.js

```javascript
import { NasaGistempService } from './infrastructure/apis/NASA/NasaGistemp/NasaGistempService';
import { createNasaGistempRoutes } from './infrastructure/apis/NASA/NasaGistemp/NasaGistempRoutes';

const nasaGistempService = new NasaGistempService();

// Iniciar sincronização automática (semanal)
nasaGistempService.startSync();

// Configurar rotas
const router = express.Router();
app.use('/api/global-temperature', createNasaGistempRoutes(router, nasaGistempService));
```

### Uso do Service

```typescript
import { NasaGistempService } from './NasaGistempService';
import { StationType } from './NasaGistempTypes';

const service = new NasaGistempService();

// Buscar dados da API
const data = await service.fetchTemperatureData(StationType.LAND_OCEAN);

// Sincronizar com MongoDB
const result = await service.syncTemperatureData(StationType.LAND_OCEAN);

// Buscar dados do MongoDB
const historicalData = await service.getTemperatureData({
  startYear: 2000,
  endYear: 2024,
  stationType: StationType.LAND_OCEAN
});
```

### Consultas no MongoDB

```typescript
import { GlobalTemperatureModel } from './NasaGistempModels';

// Dados recentes
const recentData = await GlobalTemperatureModel.find({
  stationType: 'Land-Ocean'
})
.sort({ year: -1, month: -1 })
.limit(12);

// Dados por ano específico
const yearData = await GlobalTemperatureModel.find({
  year: 2023,
  stationType: 'Land-Ocean'
});

// Dados por mês específico
const januaryData = await GlobalTemperatureModel.find({
  month: 'Jan',
  stationType: 'Land-Ocean'
})
.sort({ year: 1 });
```

## ⏰ Sincronização Automática

O módulo inclui um serviço de sincronização automática usando `node-cron`:

- **Intervalo padrão**: Todo domingo à meia-noite (`0 0 * * 0`)
- **Frequência**: Semanal (dados são atualizados mensalmente pela NASA)
- **Timezone**: UTC

### Iniciar/Parar Sincronização

```typescript
// Iniciar
service.startSync();

// Parar
service.stopSync();

// Verificar status
const status = service.getSyncStatus();
```

## ⚠️ Limitações

1. **Atualização Mensal**: A NASA atualiza os dados mensalmente, então sincronização diária não é necessária
2. **Sem API Key**: Não requer autenticação, mas está sujeito a rate limiting
3. **Formato de Dados**: A estrutura do JSON pode mudar (embora raro)
4. **Escala**: Valores são em escala 100x (120 = 1.2°C) - o módulo converte automaticamente
5. **Dados Faltantes**: Alguns meses podem ter valores nulos/missing

## 📊 Estrutura de Dados

Os dados são armazenados na collection `nasa_gistemp` com campos:

- `year` (Number, obrigatório): Ano (1880+)
- `month` (String, obrigatório): Mês (Jan-Dec)
- `anomaly` (Number, obrigatório): Anomalia de temperatura em °C
- `uncertainty` (Number, opcional): Margem de erro
- `stationType` (String, obrigatório): Tipo de estação
- `createdAt` (Date): Data de criação
- `updatedAt` (Date): Data de atualização

### Índices

- `{ year: 1, month: 1, stationType: 1 }` - Índice único (previne duplicatas)
- `{ year: -1 }` - Para consultas recentes
- `{ stationType: 1 }` - Para filtros por tipo

## 🔗 Referências

- **NASA GISTEMP:** [data.giss.nasa.gov/gistemp](https://data.giss.nasa.gov/gistemp/)
- **Documentação:** [data.giss.nasa.gov/gistemp/faq](https://data.giss.nasa.gov/gistemp/faq/)
- **Dados Mensais:** [data.giss.nasa.gov/gistemp/tabledata_v4](https://data.giss.nasa.gov/gistemp/tabledata_v4/)

## 📝 Notas de Desenvolvimento

- O módulo usa **TypeScript** para type safety
- Dados são armazenados na collection **`nasa_gistemp`** do MongoDB
- **Salvamento automático**: Dados são salvos no MongoDB sempre que `fetchTemperatureData()` é chamado
- Sincronização automática usa **node-cron** (semanal)
- Validações são feitas via **middlewares** antes de processar requisições
- Prevenção de duplicatas via índice único (year, month, stationType)
- Conversão automática da escala 100x para valores reais em °C
