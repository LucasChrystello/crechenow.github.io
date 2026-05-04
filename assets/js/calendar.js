const CrecheNowCalendar = (() => {
  const ALERTS_KEY = 'crechenow_calendar_alerts';

  const scheduleAlert = (item, refId, isAgenda = false) => {
    if (!('Notification' in window) || !item.reminder?.enabled) return;
    const alertTime = new Date(`${item.date}T${item.time || '09:00'}`);
    alertTime.setMinutes(alertTime.getMinutes() - item.reminder.minutesBefore);
    const now = new Date();
    if (alertTime <= now) return;

    const alert = {
      id: crypto.randomUUID?.() || `alert-${Date.now()}`,
      refId,
      title: item.title,
      description: item.description || '',
      triggerAt: alertTime.getTime(),
      notified: false,
      type: isAgenda ? 'agenda' : 'notification'
    };

    const alerts = JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]');
    alerts.push(alert);
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    startAlertChecker();
  };

  const startAlertChecker = () => {
    if (window._crechenowAlertChecker) return;
    window._crechenowAlertChecker = setInterval(() => {
      const alerts = JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]');
      const now = Date.now();
      alerts.forEach(alert => {
        if (!alert.notified && alert.triggerAt <= now) {
          if (Notification.permission === 'granted') {
            new Notification('🔔 CrecheNow', { body: alert.title + (alert.description ? ` - ${alert.description}` : ''), icon: '/assets/img/icons/icon-192x192.png', tag: alert.refId });
          }
          if (typeof CrecheNowNotifications?.showToast === 'function') {
            CrecheNowNotifications.showToast(`Lembrete: ${alert.title}`, 'info');
          }
          alert.notified = true;
        }
      });
      const active = alerts.filter(a => !a.notified || a.triggerAt > now + 24*60*60*1000);
      localStorage.setItem(ALERTS_KEY, JSON.stringify(active));
    }, 30000);
  };

  return {
    scheduleAlert,
    requestPermission: async () => {
      if (!('Notification' in window)) return false;
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'denied') return false;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    },
    addToDeviceCalendar: (item) => {
      if (item?.calendarLink) { window.open(item.calendarLink, '_blank'); return true; }
      return false;
    }
  };
})();