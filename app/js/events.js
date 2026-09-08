import { supabase } from './supabase-client.js';
import { enqueueEvent, isOfflineId, removeFromQueue, getQueue } from './offline-queue.js';

async function insertEvent(payload) {
  const { data, error } = await supabase.from('events').insert(payload).select().single();
  if (error) throw error;
  return data;
}

// Um evento sem conexão precisa parecer um evento real pra tudo que já lê
// `gameEvents` na tela (placar, box score, mapa de arremessos) funcionar sem
// mudança nenhuma — só o `id` denuncia que ainda não foi salvo (ver isOfflineId).
function offlinePlaceholder(localId, payload) {
  return { id: localId, pending: true, created_at: new Date().toISOString(), ...payload };
}

export async function createEvent(gameId, playerId, type, quarter = 1, shotX = null, shotY = null, source = 'manual', oppJersey = null, clockS = null) {
  const payload = { game_id: gameId, type, quarter, shot_x: shotX, shot_y: shotY, source };
  if (playerId) payload.player_id = playerId;
  if (oppJersey != null) payload.opp_jersey_number = oppJersey;
  if (clockS != null) payload.clock_s = clockS;

  if (!navigator.onLine) {
    return offlinePlaceholder(enqueueEvent(gameId, payload), payload);
  }
  try {
    return await insertEvent(payload);
  } catch (err) {
    // Erro de rede (fetch nem chegou ao servidor) vira fila local; erro de
    // verdade (RLS, dado inválido) sobe normalmente pra quem chamou avisar o usuário.
    if (err instanceof TypeError) {
      return offlinePlaceholder(enqueueEvent(gameId, payload), payload);
    }
    throw err;
  }
}

// Registra 1 ponto do adversário no quarto atual (sem player_id)
export async function createOppEvent(gameId, quarter = 1, clockS = null) {
  return createEvent(gameId, null, 'opp_1pt', quarter, null, null, 'manual', null, clockS);
}

// Retorna todos os eventos de adversários num jogo (player_id nulo, opp_jersey preenchido)
export async function getOppEvents(gameId) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('game_id', gameId)
    .is('player_id', null)
    .not('opp_jersey_number', 'is', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Retorna eventos de um número de camisa adversário em todos os jogos contra um adversário
export async function getOpponentJerseyEvents(teamId, opponentName, jerseyNumber) {
  const { data: games, error: ge } = await supabase
    .from('games')
    .select('id')
    .eq('team_id', teamId)
    .ilike('opponent', opponentName);
  if (ge) throw ge;
  if (!games?.length) return [];

  const gameIds = games.map(g => g.id);
  const { data, error } = await supabase
    .from('events')
    .select('*, games(date, opponent)')
    .in('game_id', gameIds)
    .is('player_id', null)
    .eq('opp_jersey_number', jerseyNumber);
  if (error) throw error;
  return data || [];
}

// Retorna todos os eventos de adversários em todos os jogos de um time
export async function getAllOppEvents(teamId) {
  const { data: games, error: ge } = await supabase
    .from('games')
    .select('id, opponent, date')
    .eq('team_id', teamId)
    .eq('status', 'finished');
  if (ge) throw ge;
  if (!games?.length) return { events: [], games: [] };

  const gameIds = games.map(g => g.id);
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .in('game_id', gameIds)
    .is('player_id', null)
    .not('opp_jersey_number', 'is', null);
  if (error) throw error;
  return { events: events || [], games };
}

export async function getGameEvents(gameId) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getPlayerEvents(playerId, gameId = null) {
  let query = supabase.from('events').select('*').eq('player_id', playerId);
  if (gameId) query = query.eq('game_id', gameId);
  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function deleteEvent(eventId) {
  if (isOfflineId(eventId)) { removeFromQueue(eventId); return; }
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw error;
}

// Exportado pra quem quiser tentar sincronizar a fila manualmente (ver offline-queue.js).
export { insertEvent };

// Eventos ainda não sincronizados de um jogo (sobrevive a um refresh de página
// no meio de uma queda de conexão) — mesclar com getGameEvents() no carregamento.
export function getQueuedEvents(gameId) {
  return getQueue(gameId).map(item => offlinePlaceholder(item.localId, item.payload));
}
