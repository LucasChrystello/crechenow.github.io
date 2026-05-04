document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] Iniciando...');
  
  // Inicializa módulos
  if (typeof CrecheNowStorage?.init === 'function') CrecheNowStorage.init();
  if (typeof CrecheNowAuth?.init === 'function') CrecheNowAuth.init();

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    document.getElementById('toggleSenha')?.addEventListener('click', function() {
      const input = document.getElementById('senha');
      const icon = this.querySelector('i');
      if (input.type === 'password') { input.type = 'text'; icon.classList.replace('bi-eye', 'bi-eye-slash'); }
      else { input.type = 'password'; icon.classList.replace('bi-eye-slash', 'bi-eye'); }
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      document.getElementById('emailError')?.classList.remove('show');
      document.getElementById('senhaError')?.classList.remove('show');
      if (!loginForm.checkValidity()) { loginForm.classList.add('was-validated'); return; }

      const btn = document.getElementById('btnLogin');
      const original = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verificando...';
      btn.disabled = true;

      try {
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        const lgpd = document.getElementById('lgpdConsent').checked;
        const res = await CrecheNowAuth.login(email, senha, lgpd);

        if (res.success) {
          if (typeof CrecheNowNotifications?.showToast === 'function') CrecheNowNotifications.showToast(`Bem-vindo, ${res.user.name}!`);
          setTimeout(() => { window.location.href = res.user.role === 'parent' ? 'dashboard-parent.html' : 'dashboard-staff.html'; }, 600);
        } else {
          if (res.error === 'email_not_found') { document.getElementById('emailError')?.classList.add('show'); document.getElementById('email')?.focus(); }
          else if (res.error === 'wrong_password') { document.getElementById('senhaError')?.classList.add('show'); document.getElementById('senha')?.focus(); }
          else if (typeof CrecheNowNotifications?.showToast === 'function') CrecheNowNotifications.showToast(res.msg, 'danger');
        }
      } catch (err) { console.error('[App] Erro:', err); if (typeof CrecheNowNotifications?.showToast === 'function') CrecheNowNotifications.showToast('Erro ao fazer login.', 'danger'); }
      finally { btn.innerHTML = original; btn.disabled = false; }
    });

    // Demo buttons
    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const role = btn.dataset.role;
        if (!role || !['parent', 'staff'].includes(role)) return;
        const original = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        btn.disabled = true;
        try {
          const res = await CrecheNowAuth.demoLogin(role);
          if (res.success) {
            if (typeof CrecheNowNotifications?.showToast === 'function') CrecheNowNotifications.showToast(`Demo: ${res.user.name}`);
            setTimeout(() => { window.location.href = role === 'parent' ? 'dashboard-parent.html' : 'dashboard-staff.html'; }, 600);
          } else if (typeof CrecheNowNotifications?.showToast === 'function') CrecheNowNotifications.showToast(res.msg, 'danger');
        } finally { btn.innerHTML = original; btn.disabled = false; }
      });
    });
  }

  // Staff form
  const staffForm = document.getElementById('staffForm');
  if (staffForm) {
    staffForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!staffForm.checkValidity()) { staffForm.classList.add('was-validated'); return; }
      const session = CrecheNowStorage?.getSession?.();
      if (!session) return;

      const data = {
        title: document.getElementById('notifyTitle').value.trim(),
        type: document.getElementById('notifyType').value,
        target: document.getElementById('notifyTarget').value,
        body: document.getElementById('notifyBody').value.trim(),
        senderId: session.id,
        hasAlert: document.getElementById('notifyAlert')?.checked || false,
        alertDate: document.getElementById('alertDate')?.value || null
      };

      const extra = { priority: data.type === 'alerta' ? 'high' : 'normal' };
      if (data.hasAlert && data.alertDate && typeof CrecheNowModels?.Notification?.create === 'function') {
        extra.alerts = [{ title: `Lembrete: ${data.title}`, date: data.alertDate.split('T')[0], description: data.body.substring(0, 100) }];
      }

      if (typeof CrecheNowModels?.Notification?.create === 'function') {
        const notification = CrecheNowModels.Notification.create(data.title, data.body, data.type, data.senderId, data.target, extra);
        CrecheNowStorage?.addNotification?.(notification);
        if (data.hasAlert && extra.alerts?.[0] && typeof CrecheNowCalendar?.scheduleAlert === 'function') {
          CrecheNowCalendar.scheduleAlert({ ...extra.alerts[0], time: data.alertDate?.split('T')[1] || '09:00', reminder: { enabled: true, minutesBefore: 30 } }, notification.id);
        }
      }

      staffForm.reset(); staffForm.classList.remove('was-validated');
      if (typeof CrecheNowNotifications?.showToast === 'function') CrecheNowNotifications.showToast('Comunicado enviado!');
      if (typeof CrecheNowNotifications?.renderSent === 'function') CrecheNowNotifications.renderSent();
    });
  }

  // Dashboard init
  if (window.location.pathname.includes('dashboard')) {
    const session = CrecheNowStorage?.getSession?.();
    if (!session) { window.location.href = 'index.html'; return; }
    const userNameEl = document.getElementById('userName');
    if (userNameEl && session.name) userNameEl.textContent = session.name;
    if (typeof CrecheNowNotifications?.init === 'function') CrecheNowNotifications.init();
    if (typeof CrecheNowNotifications?.renderFeed === 'function') CrecheNowNotifications.renderFeed();
    if (typeof CrecheNowNotifications?.renderAgenda === 'function') CrecheNowNotifications.renderAgenda();
    if (typeof CrecheNowNotifications?.renderSent === 'function') CrecheNowNotifications.renderSent();
    document.querySelectorAll('[data-filter]')?.forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (typeof CrecheNowNotifications?.renderFeed === 'function') CrecheNowNotifications.renderFeed(btn.dataset.filter);
    }));
    document.getElementById('logoutBtn')?.addEventListener('click', () => { if (typeof CrecheNowAuth?.logout === 'function') CrecheNowAuth.logout(); });
  }

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(err => console.error('SW erro:', err));
  }

  // PWA install
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    if (!document.getElementById('installBtn')) {
      const btn = document.createElement('button');
      btn.id = 'installBtn'; btn.className = 'btn btn-primary btn-sm fixed-bottom m-3 shadow';
      btn.innerHTML = '<i class="bi bi-download me-1"></i>Instalar CrecheNow';
      btn.addEventListener('click', async () => { deferredPrompt.prompt(); deferredPrompt = null; btn.remove(); });
      document.body.appendChild(btn);
    }
  });

  // Sync queue
  if (typeof CrecheNowStorage?.processQueue === 'function') setInterval(CrecheNowStorage.processQueue, 60000);
  console.log('[App] Pronto!');
});