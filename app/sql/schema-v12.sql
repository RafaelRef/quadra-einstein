-- CourtIQ v12 — Migration
-- Link de jogo ao vivo (público). Idempotente.
--
-- Escopo mínimo, por decisão explícita: o técnico marca UM jogo por vez como
-- compartilhável (is_public); só esse jogo — placar, eventos e as atletas que
-- entraram nele — fica visível sem login. Roster completo do time, outros
-- jogos e qualquer outro time continuam exigindo dono autenticado, exatamente
-- como hoje. Cada policy pública abaixo é ADITIVA (Postgres faz OR entre
-- policies permissivas do mesmo comando) — nenhuma policy de dono é alterada.

ALTER TABLE games ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "public_read_shared_game" ON games;
CREATE POLICY "public_read_shared_game" ON games
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "public_read_shared_game_events" ON events;
CREATE POLICY "public_read_shared_game_events" ON events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM games WHERE games.id = events.game_id AND games.is_public = true)
  );

DROP POLICY IF EXISTS "public_read_shared_game_players" ON game_players;
CREATE POLICY "public_read_shared_game_players" ON game_players
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM games WHERE games.id = game_players.game_id AND games.is_public = true)
  );

-- Só as atletas que entraram em algum jogo marcado público ficam visíveis —
-- não o elenco inteiro do time.
DROP POLICY IF EXISTS "public_read_shared_players" ON players;
CREATE POLICY "public_read_shared_players" ON players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_players
      JOIN games ON games.id = game_players.game_id
      WHERE game_players.player_id = players.id AND games.is_public = true
    )
  );

-- Nome do time na página pública ("Med Einstein vs Adversário"): não precisa de
-- policy nova. `teams` já tem "public_read_teams" (USING true) de antes — descoberto
-- ao testar esta migration, junto com "public_read_finished_games" em `games`
-- (ambas existem pra alimentar o ranking de explore.html). Adicionar mais uma
-- policy em teams aqui seria redundante — e por sinal, uma versão anterior desta
-- migration tentou isso e caiu numa recursão de RLS (42P17): "owner_games" já
-- consulta teams, então uma policy em teams que consulta games de volta faz um
-- ciclo toda vez que games OU teams é lido, por qualquer policy. Lição: nunca
-- fazer duas tabelas se referenciarem uma à outra dentro de policies de RLS.
