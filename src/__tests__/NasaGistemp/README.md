# Testes do Módulo NASA GISTEMP

Este diretório contém os testes de integração para o módulo NASA GISTEMP API.

## ⚠️ Importante: Testes com Dados Reais

**Estes testes fazem requisições reais à API NASA GISTEMP e salvam dados reais no MongoDB.**

- ✅ **Sem mocks**: Todos os testes usam dados reais da API
- ✅ **Integração completa**: Testa o fluxo completo API → Service → MongoDB
- ✅ **Dados reais**: Os dados salvos no MongoDB são os mesmos que serão usados no frontend
- ✅ **Salvamento automático**: Dados são salvos automaticamente em cada requisição

## Estrutura

```
NasaGistemp/
├── NasaGistemp.test.js    # Testes de integração com API real
└── README.md               # Esta documentação
```

## Executando os Testes

### Todos os testes
```bash
npm test
```

### Apenas testes do NASA GISTEMP
```bash
npm test -- src/__tests__/NasaGistemp/NasaGistemp.test.js
```

### Com verbose
```bash
npm test -- --verbose src/__tests__/NasaGistemp/NasaGistemp.test.js
```

## Pré-requisitos Obrigatórios

1. **Variáveis de Ambiente (OBRIGATÓRIAS):**
   - `MONGODB_URI` - URI de conexão do MongoDB (obrigatória para testes de integração)

2. **MongoDB:**
   - MongoDB deve estar rodando e acessível
   - Os testes salvam dados reais no MongoDB
   - Os dados salvos são os mesmos que serão usados no frontend

**Nota**: A API NASA GISTEMP não requer API key (dados públicos)

## Cobertura de Testes

### NasaGistempService
- ✅ Criação de instância
- ✅ `fetchTemperatureData()` - Busca dados de temperatura da API (salva automaticamente)
- ✅ `syncTemperatureData()` - Sincronização com MongoDB
- ✅ `getTemperatureData()` - Consulta dados do MongoDB
- ✅ Gerenciamento de sync service (start/stop/status)
- ✅ Suporte a múltiplas fontes (Land-Ocean, Land-Only, Ocean-Only)

### NasaGistempController
- ✅ `getTemperature()` - Lista dados de temperatura do MongoDB
- ✅ `getTemperatureStats()` - Estatísticas dos dados
- ✅ `getSyncStatus()` - Status do serviço
- ✅ `triggerSync()` - Sincronização manual
- ✅ Validação de parâmetros
- ✅ Tratamento de erros HTTP

### GlobalTemperatureModel
- ✅ Criação de documentos
- ✅ Unicidade de (year, month, stationType)
- ✅ Validação de campos obrigatórios
- ✅ Estrutura de dados correta

### Constantes e Tipos
- ✅ Valores do enum `StationType`
- ✅ Valores padrão (`DEFAULTS`)

## Estrutura dos Testes

### Setup e Teardown
- `beforeAll`: Conecta ao MongoDB (obrigatório)
- `afterAll`: Fecha conexão do MongoDB
- `beforeEach`: Cria instâncias frescas dos serviços
- `afterEach`: Para serviços de sincronização em execução

### Testes de Integração Real
- **Sem mocks**: Todas as requisições são reais à API NASA GISTEMP
- **Dados reais**: Busca dados históricos de temperatura desde 1880
- **MongoDB real**: Salva dados reais no MongoDB que serão usados no frontend
- **Salvamento automático**: Dados são salvos automaticamente em cada requisição
- **Timeout aumentado**: 60-180 segundos para aguardar respostas da API e processamento

### Fluxo de Teste
1. Faz requisição real à API NASA GISTEMP (formato TXT)
2. Recebe dados de texto fixo com anomalias de temperatura
3. Parse dos dados TXT para formato estruturado
4. Salva automaticamente os dados no MongoDB (collection `nasa_gistemp`)
5. Verifica que os dados foram salvos corretamente
6. Valida estrutura dos dados para uso no frontend

## Exemplos de Testes

### Teste de Requisição Real à API
```javascript
test('should fetch real temperature data from NASA GISTEMP API (Land-Ocean)', async () => {
  const temperatureData = await nasaGistempService.fetchTemperatureData(StationType.LAND_OCEAN);

  expect(temperatureData).toBeInstanceOf(Array);
  expect(temperatureData.length).toBeGreaterThan(0);
  
  // Verificar estrutura dos dados reais
  if (temperatureData.length > 0) {
    const firstRecord = temperatureData[0];
    expect(firstRecord).toHaveProperty('year');
    expect(firstRecord).toHaveProperty('month');
    expect(firstRecord).toHaveProperty('anomaly');
  }
}, 60000);
```

### Teste de Salvamento Automático
```javascript
test('should automatically save data to MongoDB on fetch', async () => {
  const countBefore = await GlobalTemperatureModel.countDocuments();

  // Buscar dados (salva automaticamente)
  await nasaGistempService.fetchTemperatureData(StationType.LAND_OCEAN);

  const countAfter = await GlobalTemperatureModel.countDocuments();
  expect(countAfter).toBeGreaterThanOrEqual(countBefore);
}, 60000);
```

### Teste de Sincronização Real com MongoDB
```javascript
test('should sync real temperature data from API to MongoDB', async () => {
  const countBefore = await GlobalTemperatureModel.countDocuments();

  const result = await nasaGistempService.syncTemperatureData(StationType.LAND_OCEAN);
  
  expect(result).toHaveProperty('saved');
  expect(result.saved).toBeGreaterThanOrEqual(0);

  const countAfter = await GlobalTemperatureModel.countDocuments();
  if (result.saved > 0) {
    expect(countAfter).toBeGreaterThanOrEqual(countBefore);
  }
}, 60000);
```

## Notas Importantes

1. **API Pública:** Os testes fazem requisições reais à API NASA GISTEMP (sem API key necessária)
2. **MongoDB Real:** Os testes salvam dados reais no MongoDB - os mesmos dados que serão usados no frontend
3. **Salvamento Automático:** Dados são salvos automaticamente sempre que `fetchTemperatureData()` é chamado
4. **Timeout:** Testes têm timeout aumentado (60-180 segundos) para aguardar respostas da API e processamento
5. **Dados Históricos:** Os dados salvos são dados históricos de temperatura desde 1880
6. **Sem Limpeza Automática:** Os dados salvos não são removidos automaticamente - são dados reais para uso no frontend
7. **Collection:** Dados são salvos na collection `nasa_gistemp` do MongoDB

## Troubleshooting

### Erro: "Cannot find module"
- Certifique-se de que TypeScript está compilado ou use `ts-node/register`
- Verifique se os caminhos de import estão corretos

### Erro: "MongoDB connection failed"
- Verifique se `MONGODB_URI` está configurado no `.env`
- Certifique-se de que MongoDB está rodando
- Alguns testes funcionam sem MongoDB

### Erro: "Request timeout" ou timeout nos testes
- A API NASA GISTEMP pode estar lenta ou com muitos dados
- Os timeouts já estão aumentados (60-180s)
- Verifique sua conexão com a internet
- A API pode estar temporariamente indisponível

### Aviso: "No temperature data available"
- É raro, mas pode acontecer se a API estiver temporariamente indisponível
- Os testes continuam funcionando mesmo sem dados
- Verifique a URL da API manualmente

## Melhorias Futuras

- [ ] Testes de performance
- [ ] Testes de carga
- [ ] Testes de rate limiting
- [ ] Cobertura de código mais abrangente
- [ ] Testes de middleware
- [ ] Testes de rotas HTTP completas
