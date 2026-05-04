const CrecheNowAuth = (() => {
  return {
    init: () => {
      if (typeof CrecheNowStorage?.init === 'function') CrecheNowStorage.init();
      const session = CrecheNowStorage?.getSession?.();
      const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
      if (session && isLoginPage) {
        window.location.href = session.role === 'parent' ? 'dashboard-parent.html' : 'dashboard-staff.html';
      } else if (!session && !isLoginPage) {
        window.location.href = 'index.html';
      }
    },

    login: (email, senha, lgpdConsent) => {
      if (!lgpdConsent) return { success: false, msg: 'Aceite a política de privacidade.' };
      if (typeof CrecheNowStorage?.validateLogin !== 'function') return { success: false, msg: 'Erro interno. Recarregue a página.' };
      const result = CrecheNowStorage.validateLogin(email, senha);
      if (!result.success) return { success: false, error: result.error, msg: result.msg };
      CrecheNowStorage.setSession(result.user);
      return { success: true, user: result.user };
    },

    demoLogin: async (role) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      if (typeof CrecheNowStorage?.getUsers !== 'function') return { success: false, msg: 'Erro ao carregar usuários.' };
      const users = CrecheNowStorage.getUsers();
      const demoUser = users?.find(u => u.role === role);
      if (!demoUser) return { success: false, msg: `Usuário "${role}" não encontrado.` };
      const { senha: _, ...safeUser } = demoUser;
      CrecheNowStorage.setSession(safeUser);
      return { success: true, user: safeUser };
    },

    logout: () => {
      if (typeof CrecheNowStorage?.logout === 'function') CrecheNowStorage.logout();
      window.location.href = 'index.html';
    },

    getSession: () => CrecheNowStorage?.getSession?.()
  };
})();