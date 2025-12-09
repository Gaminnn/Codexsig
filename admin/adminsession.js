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

  const sessionsList = document.getElementById('sessionsList');
  const createSessionBtn = document.getElementById('createSessionBtn');
  const searchSessions = document.getElementById('searchSessions');
  const sessionModal = document.getElementById('sessionModal');
  const closeSessionModal = document.getElementById('closeSessionModal');
  const cancelSessionBtn = document.getElementById('cancelSessionBtn');
  const submitSessionBtn = document.getElementById('submitSessionBtn');
  const sessionForm = document.getElementById('sessionForm');
  const sessionTitle = document.getElementById('sessionTitle');
  const sessionDescription = document.getElementById('sessionDescription');
  const sessionDate = document.getElementById('sessionDate');
  const sessionStartTime = document.getElementById('sessionStartTime');
  const sessionEndTime = document.getElementById('sessionEndTime');
  const sessionLocation = document.getElementById('sessionLocation');
  const sessionModalTitle = document.getElementById('sessionModalTitle');

  let sessions = [];
  let currentSessionId = null;

  // Load sessions
  async function loadSessions() {
    try {
      const res = await fetch(new URL('../adminphp/getsessions.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && Array.isArray(data.sessions)) {
        sessions = data.sessions;
      } else {
        console.error('Failed to load sessions', res.status, data);
        sessions = [];
      }
    } catch (e) {
      console.error('Error loading sessions', e);
      sessions = [];
    }
    renderSessions();
  }

  // Check if session is happening now (currently active)
  function isSessionActive(sessionDate, startTime, endTime) {
    const now = new Date();
    const [year, month, day] = sessionDate.split('-').map(Number);
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const sessionStart = new Date(year, month - 1, day, startHour, startMin);
    const sessionEnd = new Date(year, month - 1, day, endHour, endMin);
    
    return now >= sessionStart && now <= sessionEnd;
  }

  // Check if session has expired
  function isSessionExpired(sessionDate, endTime) {
    const now = new Date();
    const [year, month, day] = sessionDate.split('-').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const sessionEnd = new Date(year, month - 1, day, endHour, endMin);
    
    return now > sessionEnd;
  }

  // Check if session is upcoming
  function isSessionUpcoming(sessionDate, startTime) {
    const now = new Date();
    const [year, month, day] = sessionDate.split('-').map(Number);
    const [startHour, startMin] = startTime.split(':').map(Number);
    
    const sessionStart = new Date(year, month - 1, day, startHour, startMin);
    
    return now < sessionStart;
  }

  // Render sessions
  function renderSessions() {
    if (!sessionsList) return;

    // Get search term
    const searchTerm = searchSessions?.value?.toLowerCase().trim() || '';
    
    // Filter sessions based on search
    let filteredSessions = sessions;
    if (searchTerm) {
      filteredSessions = sessions.filter(session => 
        session.title.toLowerCase().includes(searchTerm) ||
        session.description.toLowerCase().includes(searchTerm) ||
        session.location.toLowerCase().includes(searchTerm) ||
        session.session_date.includes(searchTerm)
      );
    }

    if (!filteredSessions.length) {
      sessionsList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <p>${searchTerm ? 'No sessions match your search.' : 'No sessions yet. Create one to get started.'}</p>
        </div>
      `;
      return;
    }

    sessionsList.innerHTML = filteredSessions.map(session => {
      const sessionDate = new Date(session.session_date).toLocaleDateString();
      const adminName = session.created_by_name || 'Admin';
      const isActive = parseInt(session.is_active) === 1;
      const status = isActive ? 'Active' : 'Inactive';
      const active = isSessionActive(session.session_date, session.start_time, session.end_time);
      const expired = isSessionExpired(session.session_date, session.end_time);
      const upcoming = isSessionUpcoming(session.session_date, session.start_time);
      
      let statusBadge = '';
      let statusClass = '';
      if (active) {
        statusBadge = '🔴 Happening Now';
        statusClass = ' session-active';
      } else if (expired) {
        statusBadge = '⏳ Expired';
        statusClass = ' session-expired';
      } else if (upcoming) {
        statusBadge = '📅 Upcoming';
        statusClass = '';
      }

      return `
        <div class="session-card${statusClass}">
          <div class="session-badge">SESSION</div>
          <div class="session-content-wrapper session-clickable" data-session-id="${session.id}">
            <h3 class="session-title">${session.title}</h3>
            <p class="session-description">${session.description}</p>
            <div class="session-meta">
              <span class="meta-item">📅 ${sessionDate}</span>
              <span class="meta-item">🕐 ${session.start_time} - ${session.end_time}</span>
              <span class="meta-item">📍 ${session.location}</span>
            </div>
            <div class="session-meta">
              <span class="meta-item">👤 ${adminName}</span>
              <span class="meta-item">${isActive ? '✅' : '⭕'} ${status}</span>
              ${statusBadge ? `<span class="meta-item session-status-badge">${statusBadge}</span>` : ''}
            </div>
          </div>
          <div class="session-actions-bottom">
            <button class="btn btn-outline btn-sm" data-action="edit-session" data-id="${session.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-action="delete-session" data-id="${session.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners to action buttons
    document.querySelectorAll('[data-action="edit-session"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        handleEditSession(parseInt(id));
      });
    });

    document.querySelectorAll('[data-action="delete-session"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        handleDeleteSession(parseInt(id));
      });
    });

    // Add click handler for session cards to view attendance
    document.querySelectorAll('.session-clickable').forEach(elem => {
      elem.style.cursor = 'pointer';
      elem.addEventListener('click', (e) => {
        const sessionId = e.currentTarget.dataset.sessionId;
        window.location.href = new URL(`../admin/adminsessionattendance.html?id=${sessionId}`, window.location.href).href;
      });
    });
  }

  // Open create session modal
  function openCreateModal() {
    currentSessionId = null;
    sessionModalTitle.textContent = 'Create Session';
    sessionForm.reset();
    // Set current date as default
    const today = new Date();
    sessionDate.value = today.toISOString().slice(0, 10);
    // Set default time values
    sessionStartTime.value = '09:00';
    sessionEndTime.value = '10:00';
    // Set default radio button value to "1" (Yes/Active)
    document.querySelector('input[name="sessionActive"][value="1"]').checked = true;
    sessionModal.classList.add('open');
  }

  // Handle edit session
  function handleEditSession(sessionId) {
    console.log('Edit clicked for session:', sessionId);
    console.log('Available sessions:', sessions);
    
    const session = sessions.find(s => parseInt(s.id) === parseInt(sessionId));
    console.log('Found session:', session);
    
    if (!session) {
      alert('Session not found');
      return;
    }

    currentSessionId = parseInt(session.id);
    sessionModalTitle.textContent = 'Edit Session';
    sessionTitle.value = session.title;
    sessionDescription.value = session.description;
    sessionDate.value = session.session_date;
    sessionStartTime.value = session.start_time;
    sessionEndTime.value = session.end_time;
    sessionLocation.value = session.location;
    
    // Set radio button value
    document.querySelector(`input[name="sessionActive"][value="${session.is_active ? '1' : '0'}"]`).checked = true;
    
    console.log('Opening modal');
    sessionModal.classList.add('open');
  }

  // Handle delete session
  async function handleDeleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const res = await fetch(new URL('../adminphp/deletesession.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id: sessionId })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const msg = data?.message || 'Failed to delete session.';
        alert(msg);
        return;
      }
      alert('Session deleted successfully.');
      await loadSessions();
    } catch (err) {
      console.error('Delete session error:', err);
      alert('Could not reach server. Please try again.');
    }
  }

  // Close modal
  function closeModal() {
    sessionModal.classList.remove('open');
    currentSessionId = null;
  }

  // Submit session
  async function handleSubmitSession() {
    const title = sessionTitle?.value.trim() || '';
    const description = sessionDescription?.value.trim() || '';
    const date = sessionDate?.value || '';
    const startTime = sessionStartTime?.value || '';
    const endTime = sessionEndTime?.value || '';
    const location = sessionLocation?.value.trim() || '';
    const isActive = document.querySelector('input[name="sessionActive"]:checked')?.value || '1';

    if (!title || !description || !date || !startTime || !endTime || !location) {
      alert('Please fill in all required fields.');
      return;
    }

    // Validate end time is after start time
    if (endTime <= startTime) {
      alert('End time must be after start time.');
      return;
    }

    try {
      const url = currentSessionId
        ? '../adminphp/updatesession.php'
        : '../adminphp/createsession.php';

      const body = new URLSearchParams({
        title,
        description,
        session_date: date,
        start_time: startTime,
        end_time: endTime,
        location,
        is_active: isActive
      });

      if (currentSessionId) {
        body.append('id', currentSessionId);
      }

      const res = await fetch(new URL(url, window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const msg = data?.message || (currentSessionId ? 'Failed to update session.' : 'Failed to create session.');
        alert(msg);
        return;
      }

      closeModal();
      await loadSessions();
      console.log(currentSessionId ? 'Session updated successfully.' : 'Session created successfully.');
    } catch (err) {
      console.error('Submit session error:', err);
      alert('Could not reach server. Please try again.');
    }
  }

  // Event listeners
  if (createSessionBtn) createSessionBtn.addEventListener('click', openCreateModal);
  if (closeSessionModal) closeSessionModal.addEventListener('click', closeModal);
  if (cancelSessionBtn) cancelSessionBtn.addEventListener('click', closeModal);
  if (submitSessionBtn) submitSessionBtn.addEventListener('click', handleSubmitSession);

  // Search sessions
  if (searchSessions) {
    searchSessions.addEventListener('input', () => {
      renderSessions();
    });
  }

  // Close modal when clicking outside
  if (sessionModal) {
    sessionModal.addEventListener('click', (e) => {
      if (e.target === sessionModal) closeModal();
    });
  }



  // Initial load
  loadSessions();

  // Auto-refresh sessions every 60 seconds to update status badges
  setInterval(async () => {
    await loadSessions();
  }, 60000);
});
