document.addEventListener('DOMContentLoaded', () => {
  // Inicializa módulos
  CrecheNowAuth.init();
  CrecheNowAuth.checkSession();

  // Roteamento de formulários
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!loginForm.checkValidity()) { loginForm.classList.add('was-validated'); return; }
      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;
      const lgpd = document.getElementById('lgpdConsent').checked;
      const res = CrecheNowAuth.login(email, senha, lgpd);
      if (res.success) {
        window.location.href = CrecheNowStorage.get('session').role === 'parent' ? 'dashboard-parent.html' : 'dashboard-staff.html';
      } else {
        CrecheNowNotifications.showToast(res.msg, 'danger');
      }
    });
    document.getElementById('demoAccess')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('email').value = 'pai@email.com';
      document.getElementById('senha').value = '123456';
      document.getElementById('lgpdConsent').checked = true;
    });
  }

  const staffForm = document.getElementById('staffForm');
  if (staffForm) {
    staffForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!staffForm.checkValidity()) { staffForm.classList.add('was-validated'); return; }
      const data = {
        title: document.getElementById('notifyTitle').value,
        type: document.getElementById('notifyType').value,
        target: document.getElementById('notifyTarget').value,
        date: new Date(),
        readCount: 0,
        targetCount: document.getElementById('notifyTarget').value === 'all' ? 48 : 24
      };
      const sent = CrecheNowStorage.get('sent_notifications') || [];
      sent.unshift(data);
      CrecheNowStorage.set('sent_notifications', sent);
      staffForm.reset(); staffForm.classList.remove('was-validated');
      CrecheNowNotifications.showToast('Comunicado enviado com sucesso!');
      CrecheNowNotifications.renderSent();
    });
  }

  document.getElementById('logoutBtn')?.addEventListener('click', CrecheNowAuth.logout);

  // Filtros
  document.querySelectorAll('[data-filter]')?.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      CrecheNowNotifications.renderFeed(btn.dataset.filter);
    });
  });

  // Registra SW
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('SW registrado'))
      .catch(err => console.error('SW falha:', err));
  }

  // Instalação PWA
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!document.getElementById('installBtn')) {
      const btn = document.createElement('button');
      btn.id = 'installBtn'; btn.className = 'btn btn-outline-primary btn-sm fixed-bottom m-3';
      btn.textContent = '📲 Instalar CrecheNow';
      btn.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((res) => { if (res.outcome === 'accepted') btn.remove(); deferredPrompt = null; });
      });
      document.body.appendChild(btn);
    }
  });

  // Renderizações iniciais
  if (window.location.pathname.includes('dashboard')) {
    CrecheNowNotifications.renderFeed();
    CrecheNowNotifications.renderAgenda();
    CrecheNowNotifications.renderSent();
    setInterval(CrecheNowStorage.processQueue, 60000); // Sync a cada 1min
  }
});