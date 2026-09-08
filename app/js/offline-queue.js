// Quadra Einstein — fila local de eventos quando a rede cai no meio do jogo.
//
// O ginásio é o cenário mais provável de uso real, e wifi ruim é a norma, não a
// exceção. Em vez de perder o evento (ou travar o registro ao vivo esperando o
// Supabase responder), guardamos o payload no localStorage e tentamos de novo
// quando a conexão voltar. O time continua registrando normalmente enquanto isso.

const STORAGE_KEY = 'qe_offline_queue';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeAll(queue) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

// Guarda um evento pendente e devolve um id local (usado até sincronizar).
export function enqueueEvent(gameId, payload) {
  const localId = 'offline-' + crypto.randomUUID();
  const queue = readAll();
  queue.push({ localId, gameId, payload, queuedAt: new Date().toISOString() });
  writeAll(queue);
  return localId;
}

export function getQueue(gameId) {
  return readAll().filter(item => item.gameId === gameId);
}

export function isOfflineId(id) {
  return typeof id === 'string' && id.startsWith('offline-');
}

// Remove um item da fila (sincronizado com sucesso, ou desfeito antes de sincronizar).
export function removeFromQueue(localId) {
  writeAll(readAll().filter(item => item.localId !== localId));
}

// Tenta sincronizar tudo que está pendente para um jogo. `insertFn(payload)` deve
// devolver a linha real do banco. Chama `onSynced(localId, realRow)` a cada sucesso,
// pra quem chamou poder trocar o evento "offline-..." pelo evento real na tela.
export async function flushQueue(gameId, insertFn, onSynced) {
  const pending = getQueue(gameId);
  for (const item of pending) {
    try {
      const real = await insertFn(item.payload);
      removeFromQueue(item.localId);
      onSynced?.(item.localId, real);
    } catch {
      // ainda sem rede (ou o servidor caiu de novo) — tenta de novo na próxima chamada
      break;
    }
  }
  return getQueue(gameId).length;
}

// Liga a sincronização automática: ao reconectar e a cada `intervalMs`.
// Devolve uma função pra desligar (chamar ao sair da página de jogo ao vivo).
export function watchQueue(gameId, insertFn, { onSynced, onQueueChange, intervalMs = 15000 } = {}) {
  const tick = async () => {
    const remaining = await flushQueue(gameId, insertFn, onSynced);
    onQueueChange?.(remaining);
  };
  window.addEventListener('online', tick);
  const timer = setInterval(tick, intervalMs);
  tick();
  return () => {
    window.removeEventListener('online', tick);
    clearInterval(timer);
  };
}
