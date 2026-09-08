# CLAUDE.md — Quadra Einstein

## Visão geral

**Quadra Einstein** é a ferramenta de scouting de basquete do time da Faculdade
Israelita de Ciências da Saúde Albert Einstein. É um fork whitelabel do projeto
**CourtIQ** (`RafaelRef/Projeto-SideCourt` — repositório separado, não mexer nele
a partir daqui) com a mesma base de código, mas identidade própria e ambição de
paridade de funcionalidades com o app de referência
[Basketball Stats Assistant](https://basketballstatsassistant.com/pt/) (produto
"BSA Tracking" — o app de scouting deles; "BSA Compete" e "BSA Insights" são
produtos de liga/analytics separados, fora do nosso radar por ora).

**Importante — dois projetos, um back-end:** o código deste projeto é
independente do CourtIQ antigo (pasta/repo diferentes). Mas o Supabase por trás
é **o mesmo projeto** (`qozqmaabooerjxgxdrvo`) — o time "Medicina Einstein" já
tem jogos reais registrados lá, e não faz sentido perder esse histórico só por
causa de um rebrand de fachada.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | HTML5 puro, CSS3 com variáveis, JavaScript vanilla ES6+ (sem build) |
| Backend/DB | Supabase (PostgreSQL + Auth + RLS + Edge Functions) |
| PWA | `manifest.json` + service worker — instalável em iOS/Android/Windows/Mac a partir do mesmo código |
| i18n | `js/i18n.js` — dicionários JSON por idioma, PT-BR é o padrão |
| Fontes | Google Fonts: Barlow Condensed + Barlow |
| Deploy | Render (mesmo padrão do CourtIQ antigo) |

Sem npm, sem framework, sem bundler — abre `app/index.html` direto no navegador.

---

## Estrutura

```
MedEinstein-Basquete/
├── app/                     # o site em si (equivalente ao antigo courtiq/)
│   ├── index.html
│   ├── choose.html
│   ├── manifest.json        # PWA
│   ├── sw.js                # PWA — cache de assets pra funcionar offline/instalado
│   ├── pages/
│   ├── css/style.css
│   ├── js/
│   │   ├── i18n.js          # tradução (pt-BR padrão, en como 2ª língua)
│   │   ├── billing.js       # planos — estrutura de feature-gating SEM cobrança real
│   │   ├── competitions.js  # liga/campeonato multi-time (equivalente ao BSA Compete)
│   │   └── ...              # o resto veio do CourtIQ (auth, team, games, events, stats...)
│   └── sql/                 # migrations, numeradas (schema.sql → schema-vN.sql)
└── supabase/functions/      # Edge Functions (análise de vídeo por IA — parado, não é foco)
```

---

## Identidade visual (Fase 3)

Paleta ouro/acadêmica — diferente de propósito do azul genérico "SaaS" do CourtIQ
antigo, e sem copiar a identidade oficial da instituição (é uma ferramenta de
time de estudantes, não uma comunicação institucional):

```css
--accent:     #d4af17   /* dourado — ações primárias */
--accent2:    #e8c65a   /* dourado claro — texto sobre fundo escuro */
--accent-dim: #3d2f0a   /* dourado escurecido — fundo de badge */
--yellow:     #f97316   /* laranja — SÓ aviso/falta, não é o accent */
--green:      #22c55e   /* certo, vitória — sem mudança */
--red:        #ef4444   /* errado, derrota — sem mudança */
```

Nome do produto na UI: **Quadra Einstein** (navbar: "Quadra" + "Einstein" em
dourado). Tom de copy: time universitário, não SaaS corporativo — evitar
"assinatura", "upgrade seu plano", "premium features" em favor de linguagem mais
direta e próxima de quem realmente vai usar (jogador reserva, gestão do time).

---

## Paridade com o Basketball Stats Assistant — status

| Feature do BSA Tracking | Status aqui |
|---|---|
| Registro ao vivo rápido | ✅ manual (2 toques) + scout por voz |
| Estatísticas avançadas (Four Factors, eFG%, TS%, taxa de erro) | ✅ `stats.js: calcAdvancedStats` |
| Melhores quintetos | ✅ `lineups.js: calcLineupStats` |
| Relatórios PDF/CSV | ✅ `game-summary.html` |
| Compartilhamento ao vivo | ✅ `live.html` + `games.is_public` |
| Offline com sync | ✅ `offline-queue.js` |
| 5x5 e 3x3 | ⏳ em andamento |
| Config. de jogo (períodos/duração customizáveis) | ⏳ em andamento |
| Apps nativos (iOS/Android/Windows/Mac) | ⏳ via PWA instalável (não são 4 apps nativos separados — ver decisão abaixo) |
| Multi-idioma | ⏳ em andamento (pt-BR + en) |
| Gestão de liga/competição (BSA Compete) | ⏳ em andamento — `competitions.js` |
| Cobrança/assinatura | ⏳ estrutura de planos SEM cobrança real — ver `billing.js` |

**Decisões registradas** (contradições resolvidas com o usuário antes de construir):
- **Billing**: existe a estrutura (telas de plano, campo de plano por time,
  lógica de feature-gating) mas ninguém é cobrado de verdade e o time da Med
  Einstein sempre está no plano mais alto. Cobrar de verdade contradiria a
  instrução original da Fase 3 ("sem gate de pricing/assinatura nessa fase").
- **Apps nativos**: em vez de 4 bases de código nativas (que não seria possível
  manter nem terminar de verdade numa sessão), o caminho é um PWA instalável
  (`manifest.json` + service worker) — mesmo código, funciona como app
  instalado em qualquer plataforma.

---

## Convenções (herdadas do CourtIQ, sem mudança)

- Estado entre páginas via `localStorage` + query params + Supabase como fonte
  de verdade (ver `js/utils.js`, `js/auth.js`)
- Toda página protegida chama `requireAuth()` no topo
- RLS habilitado em toda tabela nova; nunca usar `service_role` no cliente
- Migrations em `app/sql/schema-vN.sql`, sempre idempotentes
  (`DROP POLICY IF EXISTS` antes de `CREATE POLICY`, `ADD COLUMN IF NOT EXISTS`)
- **Armadilha conhecida de RLS**: nunca fazer duas tabelas referenciarem uma à
  outra dentro de `USING (...)` de policies — dá recursão infinita (42P17). Se
  precisar, quebre o ciclo com uma função `SECURITY DEFINER`.

---

## Segurança

- `anon key` em `js/config.js` é pública por design (protegida por RLS) — nunca
  a `service_role key`
- Jogo só fica público (`live.html`) se o técnico ativar explicitamente
  (`games.is_public`, default `false`) — e mesmo público, só expõe as atletas
  que jogaram aquela partida específica, nunca o elenco inteiro do time
