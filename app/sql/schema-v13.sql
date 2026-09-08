-- Quadra Einstein v13 — Migration
-- Formato de jogo configurável (5x5/3x3) e duração de período. Idempotente.
--
-- LIMITAÇÃO CONHECIDA: 3x3 aqui é, por ora, sobretudo uma questão de formato/
-- duração de partida e tamanho do quinteto em quadra (ver lineups.js). As
-- regras de pontuação oficiais do 3x3 (arremesso de dentro do arco vale 1,
-- de fora vale 2 — diferente do 2pt/3pt do 5x5) NÃO estão implementadas ainda;
-- o box score em modo 3x3 continua somando como 5x5. Registrado aqui pra não
-- fingir que o 3x3 está completo.

ALTER TABLE games ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT '5x5';
ALTER TABLE games ADD COLUMN IF NOT EXISTS period_minutes numeric NOT NULL DEFAULT 10;
ALTER TABLE games ADD COLUMN IF NOT EXISTS num_periods integer NOT NULL DEFAULT 4;

ALTER TABLE games DROP CONSTRAINT IF EXISTS games_format_check;
ALTER TABLE games ADD CONSTRAINT games_format_check CHECK (format IN ('5x5', '3x3'));
