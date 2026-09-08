// Quadra Einstein — melhores quintetos (placar enquanto cada combinação de 5 esteve em quadra)
//
// Não precisa de tabela nova: `stints` já sabe quem estava em quadra em cada
// segundo de jogo, e todo evento carrega `clock_s` na mesma unidade (segundos
// decorridos desde o início do 1º quarto). Basta cruzar os dois.
import { isOppEvent, eventPoints } from './stats.js';

// Pontos de corte no tempo em que a composição de quem está em quadra muda —
// toda entrada/saída registrada nos stints, mais o início e o fim do jogo.
function buildBreakpoints(stints, gameEndS) {
  const points = new Set([0, gameEndS]);
  stints.forEach(s => {
    points.add(Number(s.in_s));
    points.add(s.out_s != null ? Number(s.out_s) : gameEndS);
  });
  return [...points].sort((a, b) => a - b);
}

function onCourtAt(stints, t0, t1, gameEndS) {
  return stints
    .filter(s => Number(s.in_s) <= t0 && (s.out_s != null ? Number(s.out_s) : gameEndS) >= t1)
    .map(s => s.player_id);
}

/**
 * @param {Array} events - eventos do jogo (precisam de clock_s pra entrar na conta)
 * @param {Array} stints - stints do jogo (in_s/out_s)
 * @param {number} gameEndS - duração total do jogo em segundos, pra fechar stints ainda abertos
 * @returns {Array<{playerIds, secondsPlayed, pointsFor, pointsAgainst, plusMinus}>}
 *          ordenado por tempo em quadra (desc). Só entram intervalos com exatamente
 *          5 jogadoras em quadra — o resto (banco incompleto, começo do jogo) é ignorado.
 */
export function calcLineupStats(events, stints, gameEndS) {
  const timedEvents = (events || []).filter(e => e.clock_s != null);
  const breakpoints = buildBreakpoints(stints || [], gameEndS);
  const byLineup = new Map();

  for (let i = 0; i < breakpoints.length - 1; i++) {
    const t0 = breakpoints[i], t1 = breakpoints[i + 1];
    if (t1 <= t0) continue;
    const onCourt = [...new Set(onCourtAt(stints, t0, t1, gameEndS))];
    if (onCourt.length !== 5) continue; // dado incompleto pro trecho — não dá pra atribuir

    const key = [...onCourt].sort().join(',');
    if (!byLineup.has(key)) {
      byLineup.set(key, { playerIds: onCourt, secondsPlayed: 0, pointsFor: 0, pointsAgainst: 0 });
    }
    const row = byLineup.get(key);
    row.secondsPlayed += t1 - t0;

    const isLast = i === breakpoints.length - 2;
    timedEvents
      .filter(e => Number(e.clock_s) >= t0 && (isLast ? Number(e.clock_s) <= t1 : Number(e.clock_s) < t1))
      .forEach(e => {
        const pts = eventPoints(e);
        if (!pts) return;
        if (isOppEvent(e)) row.pointsAgainst += pts;
        else row.pointsFor += pts;
      });
  }

  return [...byLineup.values()]
    .map(row => ({ ...row, plusMinus: row.pointsFor - row.pointsAgainst }))
    .sort((a, b) => b.secondsPlayed - a.secondsPlayed);
}
