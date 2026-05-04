const CrecheNowNotifications = (() => {
  const seedMockData = () => {
    if (typeof CrecheNowStorage === 'undefined') return;
    if (CrecheNowStorage.getNotifications?.()?.length > 0) return;
    const session = CrecheNowStorage.getSession?.();
    if (!session) return;

    [
      { title: 'Reunião de pais', body: 'Dia 25/04 às 18h - Auditório principal.', type: 'reuniao', target: 'all' },
      { title: 'Febre registrada', body: 'João apresentou 37.8°C às 14h.', type: 'saude', target: 'João Silva' },
      { title: 'Atividade de arte', body: 'Hoje faremos pintura com as mãos.', type: 'pedagogico', target: 'all' }
    ].forEach(data => {
      if (typeof CrecheNowModels?.Notification?.create === 'function') {
        CrecheNowStorage.addNotification?.(CrecheNowModels.Notification.create(data.title, data.body, data.type, session.id || 'staff-001', data.target, { priority: data.type === 'saude' ? 'high' : 'normal' }));
      }
    });

    if (CrecheNowStorage.getAgenda?.()?.length === 0 && typeof CrecheNowModels?.AgendaItem?.create === 'function') {
      const today = new Date();
      ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].forEach((day, i) => {
        const date = new Date(today); date.setDate(today.getDate() + i);
        const isoDate = date.toISOString().split('T')[0];
        CrecheNowStorage.addAgendaItem?.(CrecheNowModels.AgendaItem.create(`Atividade ${day}`, isoDate, `${9 + i}:00`, 'atividade', `Descrição da atividade de ${day}.`, true));
      });
    }
  };

  return {
    init: () => { seedMockData(); CrecheNowNotifications.renderFeed(); CrecheNowNotifications.renderAgenda(); CrecheNowNotifications.renderSent(); },
    
    renderFeed: (filter = 'all') => {
      const container = document.getElementById('notifications-feed');
      if (!container || typeof CrecheNowStorage === 'undefined') return;
      const session = CrecheNowStorage.getSession?.();
      if (!session) return;

      const notifications = (CrecheNowStorage.getNotifications?.(session.id, session.role) || [])
        .filter(n => filter === 'all' || n.type === filter)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      container.innerHTML = notifications.length ? '' : '<p class="text-muted text-center py-4">Nenhuma notificação encontrada.</p>';
      
      notifications.forEach(n => {
        const userHasRead = n.readBy?.some(r => r.userId === session.id);
        const userHasAck = n.acknowledgedBy?.some(a => a.userId === session.id);
        const el = document.createElement('div');
        el.className = `card notify-card mb-3 ${!userHasRead ? 'unread border-warning' : ''} ${n.priority === 'high' ? 'border-danger' : ''}`;
        el.innerHTML = `
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div><h5 class="card-title mb-0 fw-semibold">${n.title}</h5><small class="text-muted">${new Date(n.createdAt || Date.now()).toLocaleString('pt-BR')}</small></div>
              <div class="text-end"><span class="badge bg-${n.priority === 'high' ? 'danger' : 'info'} mb-1">${n.priority}</span><br><span class="badge bg-light text-dark border">${n.type}</span></div>
            </div>
            <p class="card-text mb-3">${n.body}</p>
            <div class="interaction-area border-top pt-2">
              ${!userHasRead ? `<button class="btn btn-sm btn-outline-primary mark-read" data-id="${n.id}"><i class="bi bi-eye"></i> Marcar como lido</button>` : '<span class="text-success small"><i class="bi bi-check-circle"></i> Lido</span>'}
              ${!userHasAck && session.role === 'parent' ? `<button class="btn btn-sm btn-outline-success ms-2 mark-ack" data-id="${n.id}"><i class="bi bi-hand-thumbs-up"></i> Ciente</button>` : ''}
            </div>
          </div>`;
        container.appendChild(el);
      });

      container.querySelectorAll('.mark-read').forEach(btn => btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const sess = CrecheNowStorage.getSession?.();
        if (typeof CrecheNowStorage?.markNotificationRead === 'function' && sess) {
          CrecheNowStorage.markNotificationRead(id, sess.id);
          CrecheNowNotifications.showToast('Notificação marcada como lida.');
          CrecheNowNotifications.renderFeed();
        }
      }));
      container.querySelectorAll('.mark-ack').forEach(btn => btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const sess = CrecheNowStorage.getSession?.();
        if (typeof CrecheNowStorage?.markNotificationAcknowledged === 'function' && sess) {
          CrecheNowStorage.markNotificationAcknowledged(id, sess.id);
          CrecheNowNotifications.showToast('Você confirmou estar ciente.');
          CrecheNowNotifications.renderFeed();
        }
      }));
    },

    renderAgenda: () => {
      const list = document.getElementById('agenda-list');
      if (!list || typeof CrecheNowStorage === 'undefined') return;
      const items = CrecheNowStorage.getAgenda?.() || [];
      if (!items.length) { list.innerHTML = '<li class="list-group-item text-muted text-center">Nenhuma atividade agendada.</li>'; return; }
      list.innerHTML = items.map(a => `<li class="list-group-item agenda-item"><div class="d-flex justify-content-between align-items-start"><div><strong>${a.title}</strong>${a.description ? `<br><small class="text-muted">${a.description}</small>` : ''}<br><small class="text-primary">${new Date(a.date).toLocaleDateString('pt-BR', { weekday: 'short' })} • ${a.time}</small></div><div class="text-end"><a href="${a.calendarLink || '#'}" target="_blank" class="btn btn-sm btn-outline-primary mb-1"><i class="bi bi-calendar-plus"></i></a></div></div></li>`).join('');
    },

    renderSent: () => {
      const tbody = document.getElementById('sent-notifications');
      if (!tbody || typeof CrecheNowStorage === 'undefined') return;
      const session = CrecheNowStorage.getSession?.();
      if (session?.role !== 'staff') { tbody.closest('table')?.closest('.card')?.remove(); return; }
      const sent = (CrecheNowStorage.getNotifications?.() || []).filter(n => n.senderId === session.id);
      tbody.innerHTML = sent.length ? sent.map(s => `<tr><td>${s.title}</td><td><span class="badge bg-light text-dark border">${s.type}</span></td><td><span class="text-success">${s.acknowledgedBy?.length || 0}</span>/<span class="text-muted">${s.readBy?.length || 0}</span></td><td class="text-muted small">${new Date(s.createdAt || Date.now()).toLocaleDateString('pt-BR')}</td></tr>`).join('') : '<tr><td colspan="4" class="text-center text-muted py-3">Nenhum envio registrado</td></tr>';
    },

    showToast: (msg, type = 'success') => {
      const container = document.getElementById('toast-container');
      if (!container) return alert(msg);
      const toastEl = document.createElement('div');
      toastEl.className = `toast align-items-center text-bg-${type === 'danger' ? 'danger' : 'success'} border-0 show`;
      toastEl.setAttribute('role', 'alert');
      toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
      container.appendChild(toastEl);
      setTimeout(() => { toastEl.classList.remove('show'); setTimeout(() => toastEl.remove(), 150); }, 4000);
    }
  };
})();