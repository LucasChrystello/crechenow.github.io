const CrecheNowStorage = (() => {
  const DB = {
    SESSION: 'crechenow_session',
    USERS: 'crechenow_users',
    NOTIFICATIONS: 'crechenow_notifications',
    AGENDA: 'crechenow_agenda',
    OBSERVATIONS: 'crechenow_observations',
    SYNC_QUEUE: 'crechenow_sync_queue',
    INITIALIZED: 'crechenow_initialized'
  };

  const safeParse = (key, fallback = null) => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : fallback; }
    catch { return fallback; }
  };

  const safeSet = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.error('Storage error:', e); return false; }
  };

  const seedDatabase = () => {
    if (localStorage.getItem(DB.INITIALIZED)) return false;
    console.log('🌱 Seed: populando dados iniciais...');

    const users = [
      { id: 'parent-001', email: 'pai@email.com', senha: '123456', name: 'Maria Silva', role: 'parent', childName: 'João Silva', createdAt: new Date().toISOString() },
      { id: 'parent-002', email: 'mae@email.com', senha: '123456', name: 'Ana Oliveira', role: 'parent', childName: 'Sophia Oliveira', createdAt: new Date().toISOString() },
      { id: 'staff-001', email: 'creche@municipal.gov', senha: 'staff123', name: 'Coordenação', role: 'staff', createdAt: new Date().toISOString() }
    ];
    safeSet(DB.USERS, users);

    const notifications = [
      { id: 'notif-001', title: 'Bem-vindo ao CrecheNow! 👋', body: 'Este é um ambiente de demonstração.', type: 'geral', senderId: 'staff-001', target: 'all', createdAt: new Date().toISOString(), readBy: [], acknowledgedBy: [], priority: 'normal', alerts: [] },
      { id: 'notif-002', title: 'Reunião de Pais - Abril', body: 'Dia 25/04 às 18h no auditório.', type: 'reuniao', senderId: 'staff-001', target: 'all', createdAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(), readBy: [], acknowledgedBy: [], priority: 'high', alerts: [{ title: 'Lembrete: Reunião de Pais', date: '2024-04-25', time: '17:30', description: 'Chegue com 30min de antecedência' }] },
      { id: 'notif-003', title: 'Atividade de Arte 🎨', body: 'Hoje faremos pintura com as mãos.', type: 'pedagogico', senderId: 'staff-001', target: 'João Silva', createdAt: new Date(Date.now() - 12*60*60*1000).toISOString(), readBy: [], acknowledgedBy: [], priority: 'normal', alerts: [] }
    ];
    safeSet(DB.NOTIFICATIONS, notifications);

    const today = new Date();
    const agenda = [];
    ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].forEach((day, i) => {
      const date = new Date(today); date.setDate(today.getDate() + i);
      const isoDate = date.toISOString().split('T')[0];
      agenda.push({ id: `agenda-${i+1}`, title: `Atividade ${day}`, date: isoDate, time: `${9 + i}:00`, type: 'atividade', description: `Descrição da atividade de ${day}.`, reminder: { enabled: true, minutesBefore: 30 }, calendarLink: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Atividade+${day}&dates=${isoDate.replace(/-/g,'')}T0${9+i}0000` });
    });
    safeSet(DB.AGENDA, agenda);

    localStorage.setItem(DB.INITIALIZED, 'true');
    console.log('✅ Seed concluído!');
    return true;
  };

  const emitUpdate = (eventType, data) => {
    window.dispatchEvent(new CustomEvent('crechenow:update', { detail: { type: eventType, data } }));
    try { localStorage.setItem('crechenow_event_trigger', JSON.stringify({ type: eventType, data, ts: Date.now() })); } catch {}
  };

  return {
    init: () => { seedDatabase(); },
    
    getSession: () => safeParse(DB.SESSION),
    setSession: (user) => {
      if (!user) localStorage.removeItem(DB.SESSION);
      else safeSet(DB.SESSION, { ...user, lastLogin: new Date().toISOString() });
      emitUpdate('session:change', user);
    },
    logout: () => { localStorage.removeItem(DB.SESSION); emitUpdate('session:logout', null); },

    getUsers: () => safeParse(DB.USERS, []),
    getUserById: (id) => CrecheNowStorage.getUsers().find(u => u.id === id),

    validateLogin: (email, senha) => {
      const users = CrecheNowStorage.getUsers();
      const userExists = users.find(u => u.email === email);
      if (!userExists) return { success: false, error: 'email_not_found', msg: 'E-mail não cadastrado.' };
      if (userExists.senha !== senha) return { success: false, error: 'wrong_password', msg: 'Senha incorreta.' };
      const { senha: _, ...safeUser } = userExists;
      return { success: true, user: safeUser };
    },

    getNotifications: (userId, role) => {
      const all = safeParse(DB.NOTIFICATIONS, []);
      if (role === 'staff') return all;
      const user = CrecheNowStorage.getUserById(userId);
      return all.filter(n => n.target === 'all' || n.target === user?.childName || n.target === userId);
    },
    addNotification: (notification) => {
      const list = safeParse(DB.NOTIFICATIONS, []);
      list.unshift(notification);
      safeSet(DB.NOTIFICATIONS, list);
      emitUpdate('notification:new', notification);
      return true;
    },
    updateNotification: (id, updates) => {
      const list = safeParse(DB.NOTIFICATIONS, []);
      const idx = list.findIndex(n => n.id === id);
      if (idx === -1) return false;
      list[idx] = { ...list[idx], ...updates };
      safeSet(DB.NOTIFICATIONS, list);
      emitUpdate('notification:update', { id, updates });
      return true;
    },
    markNotificationRead: (notificationId, userId, observation = '') => {
      const list = safeParse(DB.NOTIFICATIONS, []);
      const notif = list.find(n => n.id === notificationId);
      if (!notif || notif.readBy.some(r => r.userId === userId)) return false;
      notif.readBy.push({ userId, readAt: new Date().toISOString(), observation });
      return CrecheNowStorage.updateNotification(notificationId, notif);
    },
    markNotificationAcknowledged: (notificationId, userId, note = '') => {
      const list = safeParse(DB.NOTIFICATIONS, []);
      const notif = list.find(n => n.id === notificationId);
      if (!notif || notif.acknowledgedBy.some(a => a.userId === userId)) return false;
      notif.acknowledgedBy.push({ userId, acknowledgedAt: new Date().toISOString(), note });
      return CrecheNowStorage.updateNotification(notificationId, notif);
    },

    getAgenda: () => safeParse(DB.AGENDA, []),
    addAgendaItem: (item) => {
      const list = safeParse(DB.AGENDA, []);
      list.push(item);
      safeSet(DB.AGENDA, list);
      emitUpdate('agenda:new', item);
      return true;
    },

    addObservation: (notificationId, userId, text, type = 'note') => {
      const list = safeParse(DB.OBSERVATIONS, []);
      const obs = { id: crypto.randomUUID?.() || `obs-${Date.now()}`, notificationId, userId, text, type, createdAt: new Date().toISOString() };
      list.push(obs);
      safeSet(DB.OBSERVATIONS, list);
      emitUpdate('observation:new', obs);
      return obs;
    },
    getObservations: (notificationId) => safeParse(DB.OBSERVATIONS, []).filter(o => o.notificationId === notificationId),

    processQueue: () => {
      const queue = safeParse(DB.SYNC_QUEUE, []);
      if (queue.length && navigator.onLine) {
        console.log(`[Sync] ${queue.length} ações processadas`);
        safeSet(DB.SYNC_QUEUE, []);
      }
    },

    clear: (confirm = false) => { if (!confirm) return false; Object.values(DB).forEach(key => localStorage.removeItem(key)); return true; }
  };
})();