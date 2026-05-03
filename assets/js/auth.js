const CrecheNowAuth = (() => {
  const VALID_USERS = [
    { email: 'pai@email.com', senha: '123456', role: 'parent', name: 'Responsável' },
    { email: 'creche@municipal.gov', senha: 'staff123', role: 'staff', name: 'Coordenação' }
  ];

  return {
    init: () => {
      const session = CrecheNowStorage.get('session');
      if (!session) return;
      if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        window.location.href = session.role === 'parent' ? 'dashboard-parent.html' : 'dashboard-staff.html';
      }
    },
    login: (email, senha, lgpdConsent) => {
      const user = VALID_USERS.find(u => u.email === email && u.senha === senha);
      if (!user) return { success: false, msg: 'Credenciais inválidas.' };
      if (!lgpdConsent) return { success: false, msg: 'Aceite a política de privacidade.' };

      CrecheNowStorage.set('session', { role: user.role, name: user.name, email: user.email });
      return { success: true };
    },
    logout: () => {
      CrecheNowStorage.set('session', null);
      window.location.href = 'index.html';
    },
    checkSession: () => {
      const session = CrecheNowStorage.get('session');
      if (!session && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
      }
    }
  };
})();