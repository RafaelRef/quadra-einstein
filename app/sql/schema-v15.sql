-- Quadra Einstein v15 — Migration
-- Gestão de competição (equivalente simplificado ao "BSA Compete"). Idempotente.
--
-- Escopo deliberadamente contido: um campeonato de verdade (nome + temporada),
-- times entram nele, jogos apontam pra ele, classificação é calculada
-- automaticamente. NÃO tem: hierarquia de administradores de competição,
-- calendário automático, fases de grupo — isso é infraestrutura de federação
-- que segue sem usuário real aqui. Quem cria a competição não tem privilégio
-- especial sobre ela depois (sem papel de "admin"), de propósito.

CREATE TABLE IF NOT EXISTS competitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  season      TEXT,
  created_by  UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (name, season)
);

CREATE TABLE IF NOT EXISTS competition_teams (
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
  team_id        UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  joined_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (competition_id, team_id)
);

ALTER TABLE games ADD COLUMN IF NOT EXISTS competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL;

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_teams ENABLE ROW LEVEL SECURITY;

-- Leitura pública (precisa aparecer pra qualquer time decidir entrar, e pra
-- classificação em explore.html) — igual ao que já existe hoje pra `teams`.
DROP POLICY IF EXISTS "public_read_competitions" ON competitions;
CREATE POLICY "public_read_competitions" ON competitions FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_competition_teams" ON competition_teams;
CREATE POLICY "public_read_competition_teams" ON competition_teams FOR SELECT USING (true);

-- Criar competição: qualquer usuário autenticado (sem hierarquia de admin).
DROP POLICY IF EXISTS "authenticated_create_competition" ON competitions;
CREATE POLICY "authenticated_create_competition" ON competitions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Entrar numa competição: só em nome do próprio time.
DROP POLICY IF EXISTS "owner_join_competition" ON competition_teams;
CREATE POLICY "owner_join_competition" ON competition_teams
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = competition_teams.team_id AND teams.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "owner_leave_competition" ON competition_teams;
CREATE POLICY "owner_leave_competition" ON competition_teams
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = competition_teams.team_id AND teams.user_id = auth.uid())
  );
