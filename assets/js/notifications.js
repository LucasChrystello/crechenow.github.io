const CrecheNowNotifications = (() => {
  const mockFeed = [
    { id: 1, title: 'Reunião de pais', body: 'Dia 25/04 às 18h - Auditório principal.', type: 'reuniao', read: false, date: new Date(Date.now() - 7200000) },
    { id: 2, title: 'Dia da Família', body: 'Traga fotos para o mural coletivo na sexta.', type: 'pedagogico', read: true, date: new Date() },
    { id: 3, title: 'Atividades de hoje', body: '• Pintura livre • Parque • Contação de histórias', type: 'pedagogico', read: true, date: new Date(Date.now() - 86400000) }
  ];

  const agenda = [
    { day: 'Seg', time: '08:00', title: 'Roda de conversa' },
    { day: 'Ter', time: '10:30', title: 'Atividade psicomotora' },
    { day: 'Qua', time: '14:00', title: 'Soneca & Parque' }
  ];

  return {
    renderFeed: (filter = 'all') => {
      const container = document.getElementById('notifications-feed');
      if (!container) return;
      container.innerHTML = '';
      mockFeed.filter(n => filter === 'all' || n.type === filter).forEach(n => {
        const el = document.createElement('div');
        el.className = `card notify-card ${n.read ? '' : 'unread'}`;
        el.dataset.type = n.type;
        el.innerHTML = `
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="card-title mb-1 fw-semibold">${n.title}</h5>
              <span class="badge ${n.read ? 'bg-secondary' : 'bg-warning'} badge-priority">${n.read ? 'Lido' : 'Novo'}</span>
            </div>
            <p class="card-text text-muted small mb-2">${n.body}</p>
            <div class="d-flex justify-content-between align-items-center">
              <small class="text-muted">${CrecheNowNotifications.timeAgo(n.date)}</small>
              ${!n.read ? `<button class="btn btn-sm btn-outline-primary mark-read" data-id="${n.id}">Marcar como lido</button>` : ''}
            </div>
          </div>
        `;
        container.appendChild(el);
      });

      document.querySelectorAll('.mark-read').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.id);
          const item = mockFeed.find(n => n.id === id);
          if (item) { item.read = true; CrecheNowNotifications.renderFeed(); CrecheNowNotifications.showToast('Notificação marcada como lida.'); }
        });
      });
    },
    renderAgenda: () => {
      const list = document.getElementById('agenda-list');
      if (!list) return;
      list.innerHTML = agenda.map(a => `
        <li class="list-group-item agenda-item d-flex justify-content-between">
          <div><strong>${a.title}</strong><br><small class="text-muted">${a.day}</small></div>
          <span class="agenda-time">${a.time}</span>
        </li>
      `).join('');
    },
    renderSent: () => {
      const tbody = document.getElementById('sent-notifications');
      if (!tbody) return;
      const sent = CrecheNowStorage.get('sent_notifications') || [];
      tbody.innerHTML = sent.length ? sent.map(s => `
        <tr>
          <td>${s.title}</td>
          <td><span class="badge bg-light text-dark border">${s.type}</span></td>
          <td><span class="text-success fw-semibold">${s.readCount || 0}</span>/${s.targetCount || 24}</td>
          <td class="text-muted small">${new Date(s.date).toLocaleDateString('pt-BR')}</td>
        </tr>
      `).join('') : '<tr><td colspan="4" class="text-center text-muted py-3">Nenhum envio registrado</td></tr>';
    },
    showToast: (msg, type = 'success') => {
      const container = document.getElementById('toast-container');
      const toastEl = document.createElement('div');
      toastEl.className = `toast align-items-center text-bg-${type} border-0 show`;
      toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
      container.appendChild(toastEl);
      setTimeout(() => toastEl.remove(), 4000);
    },
    timeAgo: (date) => {
      const seconds = Math.floor((new Date() - date) / 1000);
      if (seconds < 60) return 'Agora';
      if (seconds < 3600) return `${Math.floor(seconds / 60)} min atrás`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)} h atrás`;
      return date.toLocaleDateString('pt-BR');
    }
  };
})();