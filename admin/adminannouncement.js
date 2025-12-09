document.addEventListener('DOMContentLoaded', async () => {
  // Session auth check - MUST BE FIRST
  try {
    const res = await fetch(new URL('../session_user.php', window.location.href).href, { credentials: 'same-origin' });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success || !['admin', 'superadmin'].includes(data.role)) {
      window.location.href = new URL('../loginpage/login.html', window.location.href).href;
      return;
    }
  } catch (e) {
    window.location.href = new URL('../loginpage/login.html', window.location.href).href;
    return;
  }

  const announcementsList = document.getElementById('announcementsList');
  const createAnnouncementBtn = document.getElementById('createAnnouncementBtn');
  const announcementModal = document.getElementById('announcementModal');
  const closeAnnouncementModal = document.getElementById('closeAnnouncementModal');
  const cancelAnnouncementBtn = document.getElementById('cancelAnnouncementBtn');
  const submitAnnouncementBtn = document.getElementById('submitAnnouncementBtn');
  const announcementForm = document.getElementById('announcementForm');
  const announcementTitle = document.getElementById('announcementTitle');
  const announcementDescription = document.getElementById('announcementDescription');
  const announcementType = document.getElementById('announcementType');
  const publishedDate = document.getElementById('publishedDate');
  const announcementModalTitle = document.getElementById('announcementModalTitle');
  const viewAnnouncementModal = document.getElementById('viewAnnouncementModal');
  const closeViewAnnouncementModal = document.getElementById('closeViewAnnouncementModal');
  const closeViewAnnouncementBtn = document.getElementById('closeViewAnnouncementBtn');
  const editViewAnnouncementBtn = document.getElementById('editViewAnnouncementBtn');

  let announcements = [];
  let currentAnnouncementId = null;

  // Load announcements
  async function loadAnnouncements() {
    try {
      const res = await fetch(new URL('../adminphp/getannouncements.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && Array.isArray(data.announcements)) {
        announcements = data.announcements;
      } else {
        console.error('Failed to load announcements', res.status, data);
        announcements = [];
      }
    } catch (e) {
      console.error('Error loading announcements', e);
      announcements = [];
    }
    renderAnnouncements();
  }

  // Render announcements
  // Check if announcement is happening right now (within 1 hour of published date)
  function isAnnouncementInProgress(publishedDate) {
    const announcementTime = new Date(publishedDate).getTime();
    const now = new Date().getTime();
    const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
    
    // In progress if published within the last hour
    return (now - announcementTime) >= 0 && (now - announcementTime) <= oneHourInMs;
  }

  function renderAnnouncements() {
    if (!announcementsList) return;

    if (!announcements.length) {
      announcementsList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <p>No announcements yet. Create one to get started.</p>
        </div>
      `;
      return;
    }

    announcementsList.innerHTML = announcements.map(announcement => {
      const typeClass = `announcement-type-${announcement.type}`;
      const typeLabel = announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1);
      const publishedDate = new Date(announcement.published_date).toLocaleDateString();
      const adminName = announcement.created_by_name || 'Admin';
      const isActive = parseInt(announcement.is_active) === 1;
      const status = isActive ? 'Active' : 'Inactive';
      const inProgress = isAnnouncementInProgress(announcement.published_date);
      const progressIndicator = inProgress ? '🔴 In Progress' : '';

      return `
        <div class="announcement-card${inProgress ? ' announcement-in-progress' : ''}" data-announcement-id="${announcement.id}" style="cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
          <div class="announcement-type-badge ${typeClass}">${typeLabel}</div>
          <div class="announcement-content-wrapper">
            <h3 class="announcement-title">${announcement.title}</h3>
            <p class="announcement-description">${announcement.description}</p>
            <div class="announcement-meta">
              <span class="meta-item">📅 ${publishedDate}</span>
              <span class="meta-item">👤 ${adminName}</span>
              <span class="meta-item">${isActive ? '✅' : '⭕'} ${status}</span>
              ${inProgress ? `<span class="meta-item announcement-progress-badge">${progressIndicator}</span>` : ''}
            </div>
          </div>
          <div class="announcement-actions-bottom">
            <button class="btn btn-outline btn-sm" data-action="edit-announcement" data-id="${announcement.id}" onclick="event.stopPropagation();">Edit</button>
            <button class="btn btn-danger btn-sm" data-action="delete-announcement" data-id="${announcement.id}" onclick="event.stopPropagation();">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners to action buttons
    document.querySelectorAll('[data-action="edit-announcement"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        handleEditAnnouncement(parseInt(id));
      });
    });

    document.querySelectorAll('[data-action="delete-announcement"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        handleDeleteAnnouncement(parseInt(id));
      });
    });
  }

  // Open create announcement modal
  function openCreateModal() {
    currentAnnouncementId = null;
    announcementModalTitle.textContent = 'Create Announcement';
    announcementForm.reset();
    // Set current date and time as default
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    publishedDate.value = now.toISOString().slice(0, 16);
    // Set default radio button value to "1" (Yes/Active)
    document.querySelector('input[name="announcementActive"][value="1"]').checked = true;
    announcementModal.classList.add('open');
  }

  // Handle edit announcement
  function handleEditAnnouncement(announcementId) {
    console.log('Edit clicked for announcement:', announcementId);
    console.log('Available announcements:', announcements);
    
    const announcement = announcements.find(a => parseInt(a.id) === parseInt(announcementId));
    console.log('Found announcement:', announcement);
    
    if (!announcement) {
      alert('Announcement not found');
      return;
    }

    currentAnnouncementId = parseInt(announcement.id);
    announcementModalTitle.textContent = 'Edit Announcement';
    announcementTitle.value = announcement.title;
    announcementDescription.value = announcement.description;
    announcementType.value = announcement.type;
    publishedDate.value = new Date(announcement.published_date).toISOString().slice(0, 16);
    
    // Set radio button value
    document.querySelector(`input[name="announcementActive"][value="${announcement.is_active ? '1' : '0'}"]`).checked = true;
    
    console.log('Opening modal');
    announcementModal.classList.add('open');
  }

  // Handle delete announcement
  async function handleDeleteAnnouncement(announcementId) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const res = await fetch(new URL('../adminphp/deleteannouncement.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id: announcementId })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const msg = data?.message || 'Failed to delete announcement.';
        alert(msg);
        return;
      }
      alert('Announcement deleted successfully.');
      await loadAnnouncements();
    } catch (err) {
      console.error('Delete announcement error:', err);
      alert('Could not reach server. Please try again.');
    }
  }

  // Close modal
  function closeModal() {
    announcementModal.classList.remove('open');
    currentAnnouncementId = null;
  }

  // Submit announcement
  async function handleSubmitAnnouncement() {
    const title = announcementTitle?.value.trim() || '';
    const description = announcementDescription?.value.trim() || '';
    const type = announcementType?.value || 'general';
    const publishedDateVal = publishedDate?.value || '';
    const isActive = document.querySelector('input[name="announcementActive"]:checked')?.value || '1';

    if (!title || !description || !publishedDateVal) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const url = currentAnnouncementId
        ? '../adminphp/updateannouncement.php'
        : '../adminphp/createannouncement.php';

      const body = new URLSearchParams({
        title,
        description,
        type,
        published_date: publishedDateVal,
        is_active: isActive
      });

      if (currentAnnouncementId) {
        body.append('id', currentAnnouncementId);
      }

      const res = await fetch(new URL(url, window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const msg = data?.message || (currentAnnouncementId ? 'Failed to update announcement.' : 'Failed to create announcement.');
        alert(msg);
        return;
      }

      closeModal();
      await loadAnnouncements();
      console.log(currentAnnouncementId ? 'Announcement updated successfully.' : 'Announcement created successfully.');
    } catch (err) {
      console.error('Submit announcement error:', err);
      alert('Could not reach server. Please try again.');
    }
  }

  // Event listeners
  if (createAnnouncementBtn) createAnnouncementBtn.addEventListener('click', openCreateModal);
  if (closeAnnouncementModal) closeAnnouncementModal.addEventListener('click', closeModal);
  if (cancelAnnouncementBtn) cancelAnnouncementBtn.addEventListener('click', closeModal);
  if (submitAnnouncementBtn) submitAnnouncementBtn.addEventListener('click', handleSubmitAnnouncement);

  // Load initial data
  await loadAnnouncements();

  // Auto-refresh every minute to update in-progress status
  setInterval(async () => {
    await loadAnnouncements();
  }, 60000); // Refresh every 60 seconds
});
