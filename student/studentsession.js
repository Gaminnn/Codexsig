document.addEventListener('DOMContentLoaded', async () => {
  // Session auth check - MUST BE FIRST
  try {
    const res = await fetch(new URL('../session_user.php', window.location.href).href, { credentials: 'same-origin' });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success || data.role !== 'student') {
      window.location.href = new URL('../loginpage/login.html', window.location.href).href;
      return;
    }
  } catch (e) {
    window.location.href = new URL('../loginpage/login.html', window.location.href).href;
    return;
  }

  const sessionsList = document.getElementById('sessionsList');
  const joinModal = document.getElementById('joinModal');
  const closeJoinModal = document.getElementById('closeJoinModal');
  const cancelJoinBtn = document.getElementById('cancelJoinBtn');
  const confirmJoinBtn = document.getElementById('confirmJoinBtn');
  const joinSessionTitle = document.getElementById('joinSessionTitle');
  const joinSessionDate = document.getElementById('joinSessionDate');
  const joinSessionTime = document.getElementById('joinSessionTime');
  const joinSessionLocation = document.getElementById('joinSessionLocation');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const logoutBtn = document.getElementById('logoutBtn');

  let sessions = [];
  let myAttendance = [];
  let currentFilter = 'all';
  let currentSessionToJoin = null;

  // Check if session is in progress
  function isSessionInProgress(sessionDate, startTime, endTime) {
    const now = new Date();
    const [year, month, day] = sessionDate.split('-').map(Number);
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const sessionStart = new Date(year, month - 1, day, startHour, startMin);
    const sessionEnd = new Date(year, month - 1, day, endHour, endMin);
    
    return now >= sessionStart && now <= sessionEnd;
  }

  // Check if session is upcoming
  function isSessionUpcoming(sessionDate, startTime) {
    const now = new Date();
    const [year, month, day] = sessionDate.split('-').map(Number);
    const [startHour, startMin] = startTime.split(':').map(Number);
    
    const sessionStart = new Date(year, month - 1, day, startHour, startMin);
    
    return now < sessionStart;
  }

  // Check if session is expired
  function isSessionExpired(sessionDate, endTime) {
    const now = new Date();
    const [year, month, day] = sessionDate.split('-').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const sessionEnd = new Date(year, month - 1, day, endHour, endMin);
    
    return now > sessionEnd;
  }

  // Load sessions
  async function loadSessions() {
    try {
      const res = await fetch(new URL('../adminphp/getsessions.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && Array.isArray(data.sessions)) {
        sessions = data.sessions.filter(s => parseInt(s.is_active) === 1);
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

  // Load my attendance
  async function loadMyAttendance() {
    try {
      const res = await fetch(new URL('../studentphp/getmyattendance.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && Array.isArray(data.attendance)) {
        myAttendance = data.attendance;
      } else {
        console.error('Failed to load attendance', res.status, data);
        myAttendance = [];
      }
    } catch (e) {
      console.error('Error loading attendance', e);
      myAttendance = [];
    }
  }

  // Check if student has joined a session
  function hasJoinedSession(sessionId) {
    return myAttendance.some(a => parseInt(a.session_id) === parseInt(sessionId));
  }

  // Render sessions
  function renderSessions() {
    if (!sessionsList) return;

    let filteredSessions = sessions;

    if (currentFilter === 'in-progress') {
      filteredSessions = sessions.filter(s => isSessionInProgress(s.session_date, s.start_time, s.end_time));
    } else if (currentFilter === 'attended') {
      filteredSessions = sessions.filter(s => hasJoinedSession(s.id));
    }

    if (!filteredSessions.length) {
      sessionsList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <p>${currentFilter === 'in-progress' ? 'No sessions in progress right now.' : currentFilter === 'attended' ? 'You haven\'t joined any sessions yet.' : 'No sessions available.'}</p>
        </div>
      `;
      return;
    }

    sessionsList.innerHTML = filteredSessions.map(session => {
      const sessionDate = new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const inProgress = isSessionInProgress(session.session_date, session.start_time, session.end_time);
      const expired = isSessionExpired(session.session_date, session.end_time);
      const upcoming = isSessionUpcoming(session.session_date, session.start_time);
      const hasJoined = hasJoinedSession(session.id);
      
      // Get bonus points if student has joined
      const attendanceRecord = myAttendance.find(a => parseInt(a.session_id) === parseInt(session.id));
      const bonusPoints = attendanceRecord ? parseInt(attendanceRecord.points_awarded || 0) : 0;

      let statusBadge = '';
      let statusClass = '';
      
      if (inProgress) {
        statusBadge = '🔴 In Progress';
        statusClass = 'in-progress';
      } else if (expired) {
        statusBadge = '⏳ Expired';
        statusClass = 'expired';
      } else if (upcoming) {
        statusBadge = '📅 Upcoming';
        statusClass = 'upcoming';
      }

      return `
        <div class="session-item ${statusClass} ${inProgress ? 'session-clickable' : ''}" ${inProgress ? `data-session-id="${session.id}"` : ''}>
          <div class="session-item-header">
            <div class="session-item-title">${session.title}</div>
            <span class="session-item-status ${statusClass}">${statusBadge}</span>
          </div>
          <p class="session-item-description">${session.description || 'No description provided'}</p>
          <div class="session-item-meta">
            <span>📍 ${session.location}</span>
            <span>📅 ${sessionDate}</span>
            <span>🕐 ${session.start_time} - ${session.end_time}</span>
            ${hasJoined ? `<span>⭐ Base: 20 pts${bonusPoints > 0 ? ` + Bonus: ${bonusPoints} pts` : ''}</span>` : ''}
          </div>
          <div class="session-item-action">
            ${hasJoined ? `
              <span class="joined-badge">✅ Joined</span>
            ` : inProgress ? `
              <button class="btn btn-primary btn-sm view-details" data-session-id="${session.id}">Join Now</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners to in-progress session cards
    document.querySelectorAll('.session-clickable').forEach(card => {
      card.addEventListener('click', () => {
        const sessionId = card.dataset.sessionId;
        if (sessionId) {
          window.location.href = `studentsessionattendance.html?id=${sessionId}`;
        }
      });
    });

    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sessionId = btn.dataset.sessionId;
        if (sessionId) {
          window.location.href = `studentsessionattendance.html?id=${sessionId}`;
        }
      });
    });
  }

  // Open join modal
  function openJoinModal(sessionId, title, date, start, end, location) {
    currentSessionToJoin = sessionId;
    joinSessionTitle.textContent = title;
    joinSessionDate.textContent = new Date(date).toLocaleDateString();
    joinSessionTime.textContent = `${start} - ${end}`;
    joinSessionLocation.textContent = location;
    joinModal.classList.add('open');
  }

  // Close join modal
  function closeModal() {
    joinModal.classList.remove('open');
    currentSessionToJoin = null;
  }

  // Handle join session
  async function handleJoinSession() {
    if (!currentSessionToJoin) return;

    try {
      const res = await fetch(new URL('../studentphp/joinsession.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ session_id: currentSessionToJoin })
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const msg = data?.message || 'Failed to join session.';
        alert(msg);
        return;
      }

      // Immediately refresh attendance to show "✅ Joined" in real-time
      await loadMyAttendance();
      closeModal();
      renderSessions();
    } catch (err) {
      console.error('Join session error:', err);
      alert('Could not reach server. Please try again.');
    }
  }

  // Filter tabs
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      renderSessions();
    });
  });

  // Search functionality
  const searchInput = document.getElementById('searchSessions');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      
      if (!query) {
        renderSessions();
        return;
      }

      let filteredSessions = sessions.filter(s => {
        const title = (s.title || '').toLowerCase();
        const description = (s.description || '').toLowerCase();
        const location = (s.location || '').toLowerCase();
        
        return title.includes(query) || description.includes(query) || location.includes(query);
      });

      // Apply current filter to search results
      if (currentFilter === 'in-progress') {
        filteredSessions = filteredSessions.filter(s => isSessionInProgress(s.session_date, s.start_time, s.end_time));
      } else if (currentFilter === 'attended') {
        filteredSessions = filteredSessions.filter(s => hasJoinedSession(s.id));
      }

      if (!filteredSessions.length) {
        sessionsList.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #666;">
            <p>No sessions match your search.</p>
          </div>
        `;
        return;
      }

      // Render filtered results as cards
      sessionsList.innerHTML = filteredSessions.map(session => {
        const sessionDate = new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const inProgress = isSessionInProgress(session.session_date, session.start_time, session.end_time);
        const expired = isSessionExpired(session.session_date, session.end_time);
        const upcoming = isSessionUpcoming(session.session_date, session.start_time);
        const hasJoined = hasJoinedSession(session.id);
        
        // Get bonus points if student has joined
        const attendanceRecord = myAttendance.find(a => parseInt(a.session_id) === parseInt(session.id));
        const bonusPoints = attendanceRecord ? parseInt(attendanceRecord.points_awarded || 0) : 0;

        let statusBadge = '';
        let statusClass = '';
        let cardClass = '';
        
        if (inProgress) {
          statusBadge = '🔴 In Progress';
          statusClass = 'status-in-progress';
          cardClass = 'session-in-progress';
        } else if (expired) {
          statusBadge = '⏳ Expired';
          statusClass = 'status-expired';
          cardClass = 'session-expired';
        } else if (upcoming) {
          statusBadge = '📅 Upcoming';
          statusClass = 'status-upcoming';
          cardClass = 'session-upcoming';
        }

        return `
          <div class="mail-card session-mail ${cardClass} ${inProgress ? 'session-clickable' : ''}" ${inProgress ? `data-session-id="${session.id}"` : ''}>
            <div class="mail-header">
              <div class="mail-avatar">📚</div>
              <div class="mail-from">
                <div class="mail-sender">${session.title}</div>
                <div class="mail-location">📍 ${session.location}</div>
              </div>
              <div class="mail-badge session-type-badge ${cardClass}">${statusBadge}</div>
            </div>
            <div class="mail-subject">
              <h3>${session.title}</h3>
            </div>
            <div class="mail-body">
              <p>${session.description || 'No description provided'}</p>
            </div>
            <div class="mail-footer">
              <span class="session-meta-item">📅 ${sessionDate}</span>
              <span class="session-meta-item">🕐 ${session.start_time} - ${session.end_time}</span>
              ${hasJoined ? `
                <div style="display: flex; flex-direction: column; gap: 4px; margin-left: 12px;">
                  <div class="session-meta-item">⭐ Base Points: 20</div>
                  <div class="session-meta-item" style="color: #9e2a2b; font-weight: 600;">Bonus Points: ${bonusPoints}</div>
                  <div class="session-meta-item" style="font-size: 12px; color: #888;">Awarded by admin</div>
                </div>
              ` : ''}
              <div style="margin-left: auto; display: flex; gap: 12px;">
                ${hasJoined ? `
                  <span class="joined-indicator">✅ Joined</span>
                ` : inProgress ? `
                  <button class="btn btn-primary btn-sm view-details" data-session-id="${session.id}">Join Now</button>
                ` : `
                  <span class="joined-indicator" style="background: #f3f4f6; color: #6b7280;">${expired ? 'Expired' : 'Upcoming'}</span>
                `}
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Re-attach click handlers for cards
      document.querySelectorAll('.session-clickable').forEach(card => {
        card.addEventListener('click', () => {
          const sessionId = card.dataset.sessionId;
          if (sessionId) {
            window.location.href = `studentsessionattendance.html?id=${sessionId}`;
          }
        });
      });

      // Re-attach click handlers for view details buttons
      document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const sessionId = btn.dataset.sessionId;
          if (sessionId) {
            window.location.href = `studentsessionattendance.html?id=${sessionId}`;
          }
        });
      });
    });
  }

  // Event listeners
  if (closeJoinModal) closeJoinModal.addEventListener('click', closeModal);
  if (cancelJoinBtn) cancelJoinBtn.addEventListener('click', closeModal);
  if (confirmJoinBtn) confirmJoinBtn.addEventListener('click', handleJoinSession);

  // Close modal when clicking outside
  if (joinModal) {
    joinModal.addEventListener('click', (e) => {
      if (e.target === joinModal) closeModal();
    });
  }

  // Initial load
  await loadMyAttendance();
  await loadSessions();

  // Auto-refresh every 60 seconds
  setInterval(async () => {
    await loadSessions();
    await loadMyAttendance();
  }, 60000);
});
