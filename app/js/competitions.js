// Quadra Einstein — competições (equivalente simplificado ao "BSA Compete").
// Sem hierarquia de admin: quem cria não tem privilégio especial depois.
import { supabase } from './supabase-client.js';

export async function getCompetitions() {
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getCompetition(id) {
  const { data, error } = await supabase.from('competitions').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createCompetition(name, season, createdByTeamId) {
  const { data, error } = await supabase
    .from('competitions')
    .insert({ name, season: season || null, created_by: createdByTeamId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCompetitionTeams(competitionId) {
  const { data, error } = await supabase
    .from('competition_teams')
    .select('team_id, teams(id, name)')
    .eq('competition_id', competitionId);
  if (error) throw error;
  return (data || []).map((row) => row.teams).filter(Boolean);
}

export async function joinCompetition(competitionId, teamId) {
  const { error } = await supabase.from('competition_teams').insert({ competition_id: competitionId, team_id: teamId });
  if (error) throw error;
}

export async function leaveCompetition(competitionId, teamId) {
  const { error } = await supabase
    .from('competition_teams')
    .delete()
    .eq('competition_id', competitionId)
    .eq('team_id', teamId);
  if (error) throw error;
}

export async function isTeamInCompetition(competitionId, teamId) {
  const { data, error } = await supabase
    .from('competition_teams')
    .select('team_id')
    .eq('competition_id', competitionId)
    .eq('team_id', teamId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

// Classificação: jogos encerrados daquela competição, agregados por time.
// Head-to-head simples: dentro de `games`, cada jogo já pertence a um dos dois
// times (o dono do jogo) — sem uma tabela de "confrontos" central, então times
// diferentes que jogaram entre si aparecem como entradas independentes (cada
// um com sua própria perspectiva do jogo). Isso é uma simplificação conhecida:
// times que não usam Quadra Einstein não aparecem na classificação.
export async function getStandings(competitionId) {
  const [teams, { data: games, error }] = await Promise.all([
    getCompetitionTeams(competitionId),
    supabase.from('games').select('team_id, our_score, opp_score, status').eq('competition_id', competitionId).eq('status', 'finished'),
  ]);
  if (error) throw error;

  return teams
    .map((team) => {
      const teamGames = (games || []).filter((g) => g.team_id === team.id);
      const wins = teamGames.filter((g) => (g.our_score || 0) > (g.opp_score || 0)).length;
      const losses = teamGames.length - wins;
      const ptsFor = teamGames.reduce((a, g) => a + (g.our_score || 0), 0);
      const ptsAgainst = teamGames.reduce((a, g) => a + (g.opp_score || 0), 0);
      return { team, played: teamGames.length, wins, losses, ptsFor, ptsAgainst };
    })
    .sort((a, b) => b.wins - a.wins || (b.ptsFor - b.ptsAgainst) - (a.ptsFor - a.ptsAgainst));
}
