-- Quadra Einstein v14 — Migration
-- Estrutura de planos (billing) EM MODO DEMONSTRAÇÃO — sem cobrança real.
-- Idempotente.
--
-- Decisão registrada com o usuário: a Fase 3 original pede explicitamente
-- "sem gate de pricing/assinatura nessa fase". Por isso todo time criado já
-- nasce no plano mais alto ('clube') e nada no app hoje checa `teams.plan`
-- pra bloquear funcionalidade — só a tela de planos (pages/billing.html) lê
-- esse campo, pra mostrar "seu plano atual". Ativar cobrança de verdade no
-- futuro significa: (1) integrar um provedor de pagamento, (2) mudar o
-- default de novos times pra 'gratis', (3) chamar `hasFeature()` de
-- js/billing.js nos pontos que hoje são só demonstrativos.

ALTER TABLE teams ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'clube';

ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_plan_check;
ALTER TABLE teams ADD CONSTRAINT teams_plan_check CHECK (plan IN ('gratis', 'treinador', 'clube'));
