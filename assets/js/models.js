const CrecheNowModels = (() => {
  const User = {
    create: (email, name, role, childName = null) => ({
      id: crypto.randomUUID?.() || `user-${Date.now()}`,
      email, name, role, childName,
      createdAt: new Date().toISOString(),
      lastLogin: null
    })
  };

  const Notification = {
    create: (title, body, type, senderId, target = 'all', extra = {}) => ({
      id: crypto.randomUUID?.() || `notif-${Date.now()}`,
      title, body, type, senderId, target,
      createdAt: new Date().toISOString(),
      readBy: [], acknowledgedBy: [],
      alerts: extra.alerts || [],
      priority: extra.priority || 'normal',
      attachments: extra.attachments || []
    }),
    markRead: (notification, userId, observation = '') => {
      if (notification.readBy.some(r => r.userId === userId)) return notification;
      return { ...notification, readBy: [...notification.readBy, { userId, readAt: new Date().toISOString(), observation }] };
    },
    markAcknowledged: (notification, userId, note = '') => {
      if (notification.acknowledgedBy.some(a => a.userId === userId)) return notification;
      return { ...notification, acknowledgedBy: [...notification.acknowledgedBy, { userId, acknowledgedAt: new Date().toISOString(), note }] };
    }
  };

  const AgendaItem = {
    create: (title, date, time, type, description = '', addReminder = true) => ({
      id: crypto.randomUUID?.() || `agenda-${Date.now()}`,
      title, date, time, type, description,
      reminder: addReminder ? { enabled: true, minutesBefore: 30 } : null,
      calendarLink: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${date.replace(/-/g,'')}T${time.replace(':','')}00/${date.replace(/-/g,'')}T${time.replace(':','')}59&details=${encodeURIComponent(description)}`
    })
  };

  return { User, Notification, AgendaItem };
})();