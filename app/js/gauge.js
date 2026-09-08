// Quadra Einstein — medidor circular reutilizável (perfil de atleta, resumo de jogo).
// Mesma linguagem visual do app de referência (BSA): anel de progresso com o
// valor no centro, em vez de só um número solto.
const CIRCUMFERENCE = 2 * Math.PI * 42; // r=42 no viewBox 0 0 100 100

export function gaugeCard(label, valuePct, sub = '') {
  const clamped = Math.max(0, Math.min(100, valuePct));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  return `
    <div class="gauge-card">
      <div class="gauge">
        <svg viewBox="0 0 100 100">
          <circle class="gauge-bg" cx="50" cy="50" r="42" />
          <circle class="gauge-fg" cx="50" cy="50" r="42" stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${offset}" />
        </svg>
        <div class="gauge-value">${valuePct}%</div>
      </div>
      <div class="gauge-label">${label}</div>
      ${sub ? `<div class="gauge-sub">${sub}</div>` : ''}
    </div>
  `;
}
