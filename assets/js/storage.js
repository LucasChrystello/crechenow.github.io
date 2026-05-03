const CrecheNowStorage = (() => {
  const STORAGE_KEY = 'crechenow_data';
  const QUEUE_KEY = 'crechenow_offline_queue';

  return {
    get: (key) => {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    set: (key, value) => {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
    },
    clear: () => localStorage.clear(),
    
    queueAction: (action) => {
      const queue = CrecheNowStorage.get(QUEUE_KEY) || [];
      queue.push({ ...action, timestamp: Date.now() });
      CrecheNowStorage.set(QUEUE_KEY, queue);
    },
    processQueue: async () => {
      const queue = CrecheNowStorage.get(QUEUE_KEY) || [];
      if (!queue.length || !navigator.onLine) return;
      
      // Simulação de sync para API futura
      console.log('Sincronizando fila offline:', queue.length, 'ações');
      CrecheNowStorage.set(QUEUE_KEY, []);
    }
  };
})();