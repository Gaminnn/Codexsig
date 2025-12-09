/**
 * Notification Bell - Show announcements in a modal
 * This file handles the notification bell icon functionality across all student pages
 */

function initNotificationBell() {
  const bellBtn = document.getElementById('notificationBellBtn');
  const notificationsPanel = document.getElementById('notificationsPanel');
  const closeBtn = document.getElementById('closeNotificationsBtn');
  const notificationsList = document.getElementById('notificationsList');
  const badge = document.getElementById('notificationBadge');

  if (!bellBtn) return; // Exit if bell button doesn't exist

  // Load and display announcements
  async function loadAnnouncements() {
    try {
      // Get the correct path based on current location
      const baseUrl = window.location.href.includes('/student/') 
        ? '../adminphp/getannouncements.php' 
        : 'adminphp/getannouncements.php';

      const response = await fetch(baseUrl, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        notificationsList.innerHTML = '<div class="notifications-empty"><p>Failed to load announcements</p></div>';
        badge.textContent = '0';
        return;
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.announcements)) {
        displayAnnouncements(data.announcements);
      } else {
        notificationsList.innerHTML = '<div class="notifications-empty"><p>No announcements available</p></div>';
        badge.textContent = '0';
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
      notificationsList.innerHTML = '<div class="notifications-empty"><p>Error loading announcements</p></div>';
      badge.textContent = '0';
    }
  }

  // Display announcements in the list
  function displayAnnouncements(announcements) {
    if (!announcements || announcements.length === 0) {
      notificationsList.innerHTML = '<div class="notifications-empty"><p>No announcements yet</p></div>';
      badge.textContent = '0';
      return;
    }

    // Count unread announcements
    const unreadAnnouncements = announcements.filter(a => !a.is_seen);
    const unreadCount = unreadAnnouncements.length > 99 ? '99+' : unreadAnnouncements.length;
    badge.textContent = unreadCount;

    notificationsList.innerHTML = announcements.map(announcement => {
      const date = new Date(announcement.published_date || announcement.created_at);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      return `
        <div class="notification-item ${!announcement.is_seen ? 'unread' : ''}">
          <div class="notification-item-header">
            <div class="notification-item-title">${escapeHtml(announcement.title)}</div>
            <span class="notification-item-status ${!announcement.is_seen ? 'unread' : 'read'}">
              ${!announcement.is_seen ? 'NEW' : 'READ'}
            </span>
          </div>
          <p class="notification-item-message">${escapeHtml(announcement.description)}</p>
          <div class="notification-item-date">${formattedDate}</div>
        </div>
      `;
    }).join('');

    // Add click handlers to notification items
    document.querySelectorAll('.notification-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        markAnnouncementRead(announcements[index].id);
      });
    });
  }

  // Mark announcement as read
  async function markAnnouncementRead(announcementId) {
    try {
      const baseUrl = window.location.href.includes('/student/')
        ? '../studentphp/markannouncementread.php'
        : 'studentphp/markannouncementread.php';

      await fetch(baseUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `announcementId=${announcementId}`
      });

      // Reload announcements to update read status
      loadAnnouncements();
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  }

  // Mark all announcements as read
  async function markAllAsRead() {
    try {
      const baseUrl = window.location.href.includes('/student/')
        ? '../studentphp/markallannounceementsread.php'
        : 'studentphp/markallannounceementsread.php';

      const response = await fetch(baseUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.ok) {
        // Reload announcements to update read status
        loadAnnouncements();
      }
    } catch (error) {
      console.error('Error marking all announcements as read:', error);
    }
  }

  // Get mark all read button and add event listener
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllAsRead);
  }

  // Open notifications panel
  bellBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    notificationsPanel.classList.toggle('open');
    loadAnnouncements();
  });

  // Close notifications panel
  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    notificationsPanel.classList.remove('open');
  });

  // Close when clicking outside the dropdown
  document.addEventListener('click', function(e) {
    if (!notificationsPanel.contains(e.target) && e.target !== bellBtn && !bellBtn.contains(e.target)) {
      notificationsPanel.classList.remove('open');
    }
  });

  // Prevent closing when clicking inside the modal
  const modalDialog = notificationsPanel.querySelector('.modal-dialog');
  if (modalDialog) {
    modalDialog.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && notificationsPanel.classList.contains('open')) {
      notificationsPanel.classList.remove('open');
    }
  });

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initial load of badge count
  loadAnnouncements();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotificationBell);
} else {
  initNotificationBell();
}
