document.addEventListener('DOMContentLoaded', async () => {
  // Session auth check
  try {
    const res = await fetch(new URL('../session_user.php', window.location.href).href, { credentials: 'same-origin' });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success || data.role !== 'student') {
      window.location.href = '../loginpage/login.html';
      return;
    }
  } catch (e) {
    window.location.href = '../loginpage/login.html';
    return;
  }

  // Elements
  const logoutBtn = document.getElementById('logoutBtn');
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  const notificationsTableBody = document.getElementById('notificationsTableBody');
  const notificationModal = document.getElementById('notificationModal');
  const closeNotificationModal = document.getElementById('closeNotificationModal');
  const closeNotificationBtn = document.getElementById('closeNotificationBtn');
  const toggleSeenBtn = document.getElementById('toggleSeenBtn');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');

  let currentNotificationId = null;
  let notifications = [];

  // Load notifications
  async function loadNotifications() {
    try {
      const res = await fetch(new URL('../studentphp/getnotifications.php', window.location.href).href, { 
        credentials: 'same-origin' 
      });
      const data = await res.json().catch(() => null);
      
      if (res.ok && data?.success && Array.isArray(data.notifications)) {
        notifications = data.notifications;
        displayNotifications();
      } else {
        notificationsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No notifications found</td></tr>';
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
      notificationsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #e74c3c;">Error loading notifications</td></tr>';
    }
  }

  // Display notifications in table
  function displayNotifications() {
    if (notifications.length === 0) {
      notificationsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No notifications</td></tr>';
      return;
    }

    notificationsTableBody.innerHTML = notifications.map(notif => `
      <tr class="notification-row ${notif.is_seen ? 'seen' : 'unseen'}">
        <td>
          <span class="status-badge ${notif.is_seen ? 'status-seen' : 'status-unseen'}">
            ${notif.is_seen ? '✓ Read' : '● Unread'}
          </span>
        </td>
        <td class="notification-title">${escapeHtml(notif.title)}</td>
        <td class="notification-preview">${escapeHtml(notif.message.substring(0, 50))}${notif.message.length > 50 ? '...' : ''}</td>
        <td class="notification-date">${formatDate(notif.created_at)}</td>
        <td>
          <button class="btn btn-outline btn-xs view-notification-btn" data-id="${notif.id}">View</button>
        </td>
      </tr>
    `).join('');

    // Add event listeners to view buttons
    document.querySelectorAll('.view-notification-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const notifId = parseInt(e.target.getAttribute('data-id'));
        openNotificationModal(notifId);
      });
    });
  }

  // Open notification modal
  function openNotificationModal(notifId) {
    const notif = notifications.find(n => n.id === notifId);
    if (!notif) return;

    currentNotificationId = notifId;
    document.getElementById('modalTitle').textContent = escapeHtml(notif.title);
    document.getElementById('modalMessage').textContent = escapeHtml(notif.message);
    document.getElementById('modalDate').textContent = formatDate(notif.created_at);
    
    const statusBadge = document.getElementById('modalStatusBadge');
    statusBadge.className = 'notification-status-badge';
    statusBadge.textContent = notif.is_seen ? '✓ Read' : '● Unread';
    statusBadge.classList.add(notif.is_seen ? 'status-seen' : 'status-unseen');

    toggleSeenBtn.textContent = notif.is_seen ? 'Mark as Unread' : 'Mark as Read';
    toggleSeenBtn.setAttribute('data-is-seen', notif.is_seen);

    notificationModal.classList.add('open');

    // Mark as read if unseen
    if (!notif.is_seen) {
      markAsRead(notifId);
    }
  }

  // Close notification modal
  function closeNotificationModalFunc() {
    notificationModal.classList.remove('open');
    currentNotificationId = null;
  }

  closeNotificationModal.addEventListener('click', closeNotificationModalFunc);
  closeNotificationBtn.addEventListener('click', closeNotificationModalFunc);

  // Mark notification as read/unread
  async function markAsRead(notifId) {
    try {
      const res = await fetch(new URL('../studentphp/marknotificationread.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ notificationId: notifId })
      });

      const data = await res.json().catch(() => null);
      if (data?.success) {
        const notif = notifications.find(n => n.id === notifId);
        if (notif) {
          notif.is_seen = true;
        }
        displayNotifications();
      }
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  }

  // Toggle seen/unseen
  toggleSeenBtn.addEventListener('click', async () => {
    if (!currentNotificationId) return;

    const isSeen = toggleSeenBtn.getAttribute('data-is-seen') === 'true';
    
    try {
      const res = await fetch(new URL('../studentphp/togglenotificationseen.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ notificationId: currentNotificationId })
      });

      const data = await res.json().catch(() => null);
      if (data?.success) {
        const notif = notifications.find(n => n.id === currentNotificationId);
        if (notif) {
          notif.is_seen = !isSeen;
        }
        openNotificationModal(currentNotificationId);
        displayNotifications();
      } else {
        alert('Error updating notification status');
      }
    } catch (e) {
      console.error('Error toggling notification seen:', e);
      alert('Error updating notification');
    }
  });

  // Mark all as read
  markAllReadBtn.addEventListener('click', async () => {
    if (notifications.length === 0) return;

    try {
      const res = await fetch(new URL('../studentphp/markallnotificationsread.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const data = await res.json().catch(() => null);
      if (data?.success) {
        notifications.forEach(notif => notif.is_seen = true);
        displayNotifications();
        alert('All notifications marked as read');
      }
    } catch (e) {
      console.error('Error marking all as read:', e);
    }
  });

  // Mobile menu toggle
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
      }
    });
  }

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === notificationModal) {
      closeNotificationModalFunc();
    }
  });

  // Utility functions
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
    }
  }

  // Initial load
  await loadNotifications();
});
