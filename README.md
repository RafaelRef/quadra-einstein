# Quadra Einstein

Ferramenta de scouting de basquete do time da Faculdade Israelita de Ciências
da Saúde Albert Einstein — registro de estatísticas ao vivo, box score,
estatísticas avançadas, shot chart, melhores quintetos e placar compartilhável.

Fork whitelabel do projeto CourtIQ, evoluindo em direção à paridade de
funcionalidades com o [Basketball Stats Assistant](https://basketballstatsassistant.com/pt/).
Ver [`CLAUDE.md`](CLAUDE.md) pra contexto completo, arquitetura e status da
paridade de features.

## Rodando localmente

Sem build, sem npm. Só abrir `app/index.html` num navegador, ou servir a pasta
com qualquer servidor estático:

```bash
python3 -m http.server 8080 --directory .
# depois abrir http://localhost:8080/app/index.html
```

Credenciais do Supabase já estão em `app/js/config.js` (é a `anon key`,
protegida por Row Level Security — segura de expor no frontend).

## Stack

HTML5 + CSS3 + JavaScript vanilla, Supabase (Postgres + Auth + RLS + Edge
Functions), PWA instalável. Sem framework, sem bundler.
