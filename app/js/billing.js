// Quadra Einstein — estrutura de planos, EM MODO DEMONSTRAÇÃO.
//
// Ninguém é cobrado de verdade e todo time nasce no plano mais alto ('clube') —
// ver schema-v14.sql pro porquê. `hasFeature()` existe pra provar que o
// mecanismo de feature-gating é real (não é só uma tela bonita), mas hoje
// nenhuma outra parte do app chama essa função pra bloquear nada.
import { supabase } from './supabase-client.js';

export const PLANS = {
  gratis: {
    label: 'Grátis',
    price: 'R$ 0',
    period: 'pra sempre',
    features: [
      'Times e jogos ilimitados',
      'Box score básico',
      'Histórico das últimas 3 partidas',
    ],
    missing: ['Estatísticas avançadas', 'Melhores quintetos', 'Exportar PDF/CSV', 'Link ao vivo'],
  },
  treinador: {
    label: 'Treinador',
    price: 'R$ 29',
    period: '/mês',
    features: [
      'Tudo do Grátis',
      'Estatísticas avançadas (Four Factors, eFG%, TS%)',
      'Melhores quintetos',
      'Exportar PDF e CSV ilimitado',
      'Link de jogo ao vivo',
    ],
    missing: ['Múltiplos times sob uma mesma conta'],
  },
  clube: {
    label: 'Clube',
    price: 'sob consulta',
    period: '',
    features: [
      'Tudo do Treinador',
      'Múltiplos times sob uma mesma conta',
      'Gestão de liga/competição',
    ],
    missing: [],
  },
};

const PLAN_ORDER = ['gratis', 'treinador', 'clube'];

export function getTeamPlan(team) {
  return PLANS[team?.plan] ? team.plan : 'clube';
}

// Verifica se um time tem acesso a uma feature associada a um plano mínimo.
// Ex.: hasFeature(team, 'treinador') — true se o time está em 'treinador' ou 'clube'.
export function hasFeature(team, minPlan) {
  const teamPlanIndex = PLAN_ORDER.indexOf(getTeamPlan(team));
  const minPlanIndex = PLAN_ORDER.indexOf(minPlan);
  return teamPlanIndex >= minPlanIndex;
}

export async function setTeamPlan(teamId, plan) {
  const { error } = await supabase.from('teams').update({ plan }).eq('id', teamId);
  if (error) throw error;
}
