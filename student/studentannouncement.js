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
  const announcementsTableBody = document.getElementById('announcementsTableBody');
  const announcementModal = document.getElementById('announcementModal');
  const closeAnnouncementModal = document.getElementById('closeAnnouncementModal');
  const closeAnnouncementBtn = document.getElementById('closeAnnouncementBtn');
  const toggleSeenBtn = document.getElementById('toggleSeenBtn');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');

  let currentAnnouncementId = null;
  let announcements = [];

  // Load announcements
  async function loadAnnouncements() {
    try {
      const res = await fetch(new URL('../adminphp/getannouncements.php', window.location.href).href, { 
        credentials: 'same-origin' 
      });
      const data = await res.json().catch(() => null);
      
      if (res.ok && data?.success && Array.isArray(data.announcements)) {
        announcements = data.announcements;
        displayAnnouncements();
      } else {
        announcementsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No announcements found</td></tr>';
      }
    } catch (e) {
      console.error('Error loading announcements:', e);
      announcementsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #e74c3c;">Error loading announcements</td></tr>';
    }
  }

  // Display announcements in table
  function displayAnnouncements() {
    if (announcements.length === 0) {
      announcementsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No announcements</td></tr>';
      return;
    }

    announcementsTableBody.innerHTML = announcements.map(announcement => `
      <tr class="notification-row ${announcement.is_seen ? 'seen' : 'unseen'}">
        <td>
          <span class="status-badge ${announcement.is_seen ? 'status-seen' : 'status-unseen'}">
            ${announcement.is_seen ? '✓ Read' : '● Unread'}
          </span>
        </td>
        <td class="notification-title">${escapeHtml(announcement.title)}</td>
        <td class="notification-preview">${escapeHtml(announcement.description.substring(0, 50))}${announcement.description.length > 50 ? '...' : ''}</td>
        <td class="notification-date">${formatDate(announcement.published_date)}</td>
        <td>
          <button class="btn btn-outline btn-xs view-announcement-btn" data-id="${announcement.id}">View</button>
        </td>
      </tr>
    `).join('');

    // Add event listeners to view buttons
    document.querySelectorAll('.view-announcement-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const announcementId = parseInt(e.target.getAttribute('data-id'));
        openAnnouncementModal(announcementId);
      });
    });
  }

  // Open announcement modal
  function openAnnouncementModal(announcementId) {
    const announcement = announcements.find(a => a.id === announcementId);
    if (!announcement) return;

    currentAnnouncementId = announcementId;
    document.getElementById('modalTitle').textContent = escapeHtml(announcement.title);
    document.getElementById('modalMessage').textContent = escapeHtml(announcement.description);
    document.getElementById('modalDate').textContent = formatDate(announcement.published_date);
    
    const statusBadge = document.getElementById('modalStatusBadge');
    statusBadge.className = 'notification-status-badge';
    statusBadge.textContent = announcement.is_seen ? '✓ Read' : '● Unread';
    statusBadge.classList.add(announcement.is_seen ? 'status-seen' : 'status-unseen');

    toggleSeenBtn.textContent = announcement.is_seen ? 'Mark as Unread' : 'Mark as Read';
    toggleSeenBtn.setAttribute('data-is-seen', announcement.is_seen);

    announcementModal.classList.add('open');

    // Mark as read if unseen
    if (!announcement.is_seen) {
      markAsRead(announcementId);
    }
  }

  // Close announcement modal
  function closeAnnouncementModalFunc() {
    announcementModal.classList.remove('open');
    currentAnnouncementId = null;
  }

  closeAnnouncementModal.addEventListener('click', closeAnnouncementModalFunc);
  closeAnnouncementBtn.addEventListener('click', closeAnnouncementModalFunc);

  // Mark announcement as read/unread
  async function markAsRead(announcementId) {
    try {
      const res = await fetch(new URL('../studentphp/markannouncementread.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ announcementId: announcementId })
      });

      const data = await res.json().catch(() => null);
      if (data?.success) {
        const announcement = announcements.find(a => a.id === announcementId);
        if (announcement) {
          announcement.is_seen = true;
        }
        displayAnnouncements();
      }
    } catch (e) {
      console.error('Error marking announcement as read:', e);
    }
  }

  // Toggle seen/unseen
  toggleSeenBtn.addEventListener('click', async () => {
    if (!currentAnnouncementId) return;

    const isSeen = toggleSeenBtn.getAttribute('data-is-seen') === 'true';
    
    try {
      const res = await fetch(new URL('../studentphp/toggleannouncementseen.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ announcementId: currentAnnouncementId })
      });

      const data = await res.json().catch(() => null);
      if (data?.success) {
        const announcement = announcements.find(a => a.id === currentAnnouncementId);
        if (announcement) {
          announcement.is_seen = !isSeen;
        }
        openAnnouncementModal(currentAnnouncementId);
        displayAnnouncements();
      } else {
        alert('Error updating announcement status');
      }
    } catch (e) {
      console.error('Error toggling announcement seen:', e);
      alert('Error updating announcement');
    }
  });

  // Mark all as read
  markAllReadBtn.addEventListener('click', async () => {
    if (announcements.length === 0) return;

    try {
      const res = await fetch(new URL('../studentphp/markallannounceementsread.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const data = await res.json().catch(() => null);
      if (data?.success) {
        announcements.forEach(announcement => announcement.is_seen = true);
        displayAnnouncements();
        alert('All announcements marked as read');
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
    if (e.target === announcementModal) {
      closeAnnouncementModalFunc();
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
  await loadAnnouncements();
});
