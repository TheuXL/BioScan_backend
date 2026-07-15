# BioScan Frontend — ideia e propósito

Documento de visão do **cliente web** do BioScan. A ideia geral do produto está em [`IDEIA.md`](../../IDEIA.md) (raiz do repositório). O backend expõe os dados em [`README.md`](../../README.md).

---

## Papel do frontend

O frontend é a **face visível** do BioScan: onde a ideia deixa de ser conceito e vira **experiência**. Enquanto o backend agrega e serve dados ambientais de fontes públicas, o frontend **traduz** esses dados num **globo interativo** que qualquer pessoa consegue explorar — sem jargão, sem relatórios longos, sem precisar saber de onde vem cada API.

O utilizador não “consulta um serviço”: **gira o planeta**, **liga camadas**, **aproxima da sua região** e **percebe** o que está a acontecer ao ambiente.

---

## Porque o frontend existe

Notícias sobre incêndios, calor, gelo, florestas, oceano ou espécies em risco chegam muitas vezes **fragmentadas** — uma manchete de cada vez, desligada do resto. O frontend existe para **juntar o retrato**: o mesmo ecrã pode mostrar fumo num continente, ar numa cidade, gelo a encolher e lixo no mar, conforme as camadas que a pessoa escolhe.

Queremos que qualquer utilizador diga **“eu vi no mapa”** — e que isso signifique uma ligação directa entre o dedo no ecrã e um dado real sobre o planeta. O frontend torna o ambiente **próximo**, **comparável** e **memorável**.

---

## Experiência central: o globo

A história do BioScan conta-se em torno de um **planeta à frente do utilizador** — rotacionável, ampliável, sempre presente.

- **O globo é o protagonista** — painéis, listas e textos orbitam em torno dele; nunca o escondem por completo.
- **Camadas ligam e desligam** — hoje só incêndios; amanhã incêndios e qualidade do ar; noutro dia nível do mar e desmatamento. Cada camada é uma narrativa que se sobrepõe ou se compara com as outras.
- **Milhares ou milhões de pontos** — cada ponto é um facto medido: um foco de calor, uma estação, um sismo, um registo de lixo. O desafio é **aglomerar com inteligência** (cor, intensidade, zoom) para que a densidade de informação seja **impressionante**, não confusa.
- **Cores e intensidade** — vermelho para o crítico ou quente, azuis para gelo e frio, tons para o ar — para quem não lê gráficos **sentir** a gravidade.
- **Tempo** — deslizar no tempo: o planeta de há dez anos versus hoje; uma semana de fumo; uma temporada de secas. O tempo transforma estatística em **narrativa**.
- **Zoom no que importa** — do mundo inteiro à região local, para que ninguém pense que “isso é longe”: o ambiente é **global e local** ao mesmo tempo.

---

## O que queremos mostrar no globo

A lista **cresce com o tempo**; o frontend deve estar preparado para **novas camadas** sem reinventar a experiência de cada vez.

### Camadas já previstas na visão do produto

| Tema | O que o utilizador percebe |
|------|----------------------------|
| **Fogo e calor** | Onde arde ou ardeu; escala e proximidade de florestas e zonas habitadas. |
| **Temperatura global** | A “febre” do planeta ao longo dos anos — tendência, não só um número. |
| **Nível do mar / degelo** | A ligação entre gelo que desaparece e oceano que sobe. |
| **Meteorologia e ar** | Contexto local: tempo e qualidade do ar perto de onde se navega. |
| **Sismos** | Eventos súbitos que lembram que a crosta também “fala”. |
| **Eventos naturais** | Tempestades, erupções e outros fenómenos por região e época. |
| **Desmatamento** | Onde a pressão humana sobre florestas é mais visível. |
| **Poluição marinha** | Que o oceano não é descanso infinito do lixo que produzimos. |
| **Biodiversidade** | Onde a vida está em risco e porque isso importa. |

### Camadas futuras (mesma lógica: ver para acreditar)

Mais oceanos e gelo, uso do solo, imagens de satélite sobre o planeta — sempre como **camadas opcionais** no mesmo globo.

Nem tudo é um ponto no mapa: séries longas (ex.: temperatura global, nível do mar) podem aparecer em **painéis laterais**, gráficos ou indicadores junto ao globo, sem competir com a visualização geográfica.

---

## Como o utilizador interage

### Navegação e descoberta

- **Entrada simples** — o utilizador vê o globo e percebe de imediato que pode explorar; não precisa de manual.
- **Lista de camadas** — agrupada por tema (fogo, oceano, clima, vida…), com estado claro: ligada, a carregar, indisponível, sem dados na região visível.
- **Índice de camadas** — descobrir o que existe hoje e o que virá; transparência sobre fontes (nome da instituição, data da última actualização quando relevante).

### Detalhe e contexto humano

- **Toque ou clique num ponto** — painel com o essencial: o quê, onde, quando, quão grave — em **frases curtas**, sem jargão.
- **Tom de alerta com esperança** — medir é o primeiro passo para agir; o texto não deve paralisar nem minimizar.
- **Comparação** — quando fizer sentido, mostrar duas camadas ou dois momentos no tempo para o utilizador **ver a diferença**.

### Layout (visão de produto)

Referências visuais em [`docs/referencias/`](referencias/). Em termos de experiência:

- **Desktop** — barra superior para navegação global; painel lateral para camadas; painel de detalhe quando se selecciona um ponto ou região. O globo mantém-se sempre visível no centro.
- **Mobile** — o globo continua central; camadas e detalhes em **folhas inferiores** (bottom sheets) para não perder a sensação de “planeta na mão”.
- **Modo escuro imersivo** — fundo profundo para os dados brilharem; interface leve, quase tipo instrumento de observação, não um dashboard corporativo pesado.

Detalhes de cor, tipografia e componentes: [`referencias/stitch (1)/DESIGN.md`](referencias/stitch%20(1)/DESIGN.md).

---

## Relação com o backend

O frontend **consome** a API REST do BioScan; não fala directamente com dezenas de instituições.

- **Camadas normalizadas** — quando o backend entrega o contrato comum de pontos (`PontoGloboV1`), o cliente trata todas as camadas da mesma forma: desenhar, agrupar, colorir, filtrar.
- **Camadas em formato próprio** — alguns endpoints devolvem GeoJSON ou estruturas específicas; o frontend adapta a visualização, mas mantém **o mesmo padrão de interacção** (ligar camada → ver no globo → abrir detalhe).
- **Estado honesto** — se os dados ainda não chegaram, a API falhou ou a região não tem registos, o utilizador vê isso claramente (mensagem humana, não ecrã em branco ou erro técnico).

O frontend não substitui o trabalho do backend: **pede**, **mostra** e **explica** o que o backend já tornou acessível.

---

## Objetivos do frontend

| Objetivo | Descrição |
|----------|-----------|
| **Acessibilidade** | Qualquer pessoa explora sem formação científica. |
| **Clareza** | Dados densos, interface simples; agregação inteligente por zoom. |
| **Gratuidade** | Experiência completa sem paywall; alinhada à missão do produto. |
| **Transparência** | Fonte e actualização visíveis quando importam para confiança. |
| **Extensibilidade** | Novas camadas entram na mesma experiência de globo + painéis. |
| **Performance perceptível** | Carregamento progressivo; o globo responde antes de todos os pontos estarem no ecrã. |

---

## O que o frontend **não** é

- **Não é um portal de notícias** — informa com dados, não com manchetes soltas.
- **Não é um relatório PDF interactivo** — prioriza ver e sentir, não ler dezenas de páginas.
- **Não é uma ferramenta só para cientistas** — rigor nas fontes, linguagem para todos.
- **Não promete previsão ou certeza absoluta** — mostra o que foi medido ou observado, com o contexto adequado.

---

## Impacto que queremos ter

O frontend existe para que mais gente **veja o planeta como ele é** — não como um abstracto distante, mas como **casa partilhada**. Quando alguém aproxima do seu bairro e vê ar, calor ou eventos na região, o problema deixa de ser “lá longe”. Quando alguém liga várias camadas e vê padrões continentais, percebe que **milhões de dados já contavam esta história** — só faltava uma forma de as ver juntas.

Medir, mostrar e tornar visível é contribuir para **decisões informadas**, **consciência colectiva** e **cuidado** com o ambiente. Esse é o propósito de cada ecrã, cada camada e cada ponto no globo.

---

## Próximos passos (visão, não roadmap técnico)

1. Globo funcional com **uma ou duas camadas** piloto (ex.: fogo, sismos) — provar o ciclo ligar → ver → detalhar.
2. Painel de camadas e detalhe com **textos humanos** e estados de carregamento claros.
3. Controlo de **tempo** onde a fonte o permitir.
4. Refinar **mobile** sem sacrificar o globo.
5. Ir acrescentando camadas à medida que o backend as disponibiliza — sempre com a mesma promessa: **gratuito, interactivo, claro**.
