document.addEventListener('DOMContentLoaded', async () => {
  // Session auth check
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

  const logoutBtn = document.getElementById('logoutBtn');
  const attendanceModal = document.getElementById('attendanceModal');
  const closeAttendanceModal = document.getElementById('closeAttendanceModal');
  const closeAttendanceBtn = document.getElementById('closeAttendanceBtn');

  let allAttendanceRecords = [];
  let allSessions = {};

  // Load all attendance records
  async function loadAttendanceRecords() {
    try {
      const res = await fetch(new URL('../studentphp/getmyattendance.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && Array.isArray(data.attendance)) {
        allAttendanceRecords = data.attendance;
        await loadAllSessions();
        renderAttendanceRecords();
        setupSearch();
      } else {
        document.getElementById('attendanceList').innerHTML = '<p style="text-align: center; color: #999;">No attendance records found.</p>';
      }
    } catch (e) {
      console.error('Error loading attendance records', e);
      document.getElementById('attendanceList').innerHTML = '<p style="text-align: center; color: red;">Error loading attendance records.</p>';
    }
  }

  // Load all sessions to get session details
  async function loadAllSessions() {
    try {
      const res = await fetch(new URL('../adminphp/getsessions.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && Array.isArray(data.sessions)) {
        data.sessions.forEach(session => {
          allSessions[session.id] = session;
        });
      }
    } catch (e) {
      console.error('Error loading sessions', e);
    }
  }

  // Render attendance records
  function renderAttendanceRecords() {
    const attendanceList = document.getElementById('attendanceList');

    if (allAttendanceRecords.length === 0) {
      attendanceList.innerHTML = '<p style="text-align: center; color: #999;">No attendance records found.</p>';
      return;
    }

    const recordsHTML = allAttendanceRecords.map((record, index) => {
      const session = allSessions[record.session_id] || {};
      const isPresent = parseInt(record.is_present) === 1;
      const bonusPoints = parseInt(record.points_awarded || 0);
      const totalPoints = 20 + bonusPoints;

      const sessionDate = new Date(session.session_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const startTime = session.start_time || '—';
      const endTime = session.end_time || '—';

      return `
        <div class="attendance-record-card" data-record-index="${index}" style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
          <div class="record-header">
            <h3>${session.title || 'Unknown Session'}</h3>
            <span class="record-status ${isPresent ? 'status-present' : 'status-pending'}">
              ${isPresent ? '✅ Present' : '⏳ Pending'}
            </span>
          </div>
          <div class="record-details">
            <div class="detail">
              <span class="detail-icon">📅</span>
              <span>${sessionDate}</span>
            </div>
            <div class="detail">
              <span class="detail-icon">🕐</span>
              <span>${startTime} - ${endTime}</span>
            </div>
            <div class="detail">
              <span class="detail-icon">📍</span>
              <span>${session.location || '—'}</span>
            </div>
            <div class="detail">
              <span class="detail-icon">⭐</span>
              <span><strong>${totalPoints} pts</strong> (20 guaranteed + ${bonusPoints} bonus)</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    attendanceList.innerHTML = recordsHTML;

    // Add click listeners to attendance cards
    document.querySelectorAll('.attendance-record-card').forEach(card => {
      card.addEventListener('click', () => {
        const recordIndex = parseInt(card.getAttribute('data-record-index'));
        openAttendanceModal(recordIndex);
      });
    });
  }

  // Open attendance detail modal
  function openAttendanceModal(recordIndex) {
    const record = allAttendanceRecords[recordIndex];
    if (!record) return;

    const session = allSessions[record.session_id] || {};
    const isPresent = parseInt(record.is_present) === 1;
    const bonusPoints = parseInt(record.points_awarded || 0);
    const totalPoints = 20 + bonusPoints;

    const sessionDate = new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const startTime = session.start_time || '—';
    const endTime = session.end_time || '—';

    document.getElementById('modalSessionTitle').textContent = session.title || 'Unknown Session';
    document.getElementById('modalDate').textContent = sessionDate;
    document.getElementById('modalTime').textContent = `${startTime} - ${endTime}`;
    document.getElementById('modalLocation').textContent = session.location || '—';
    
    const statusBadge = document.getElementById('modalStatus');
    statusBadge.className = 'role-badge';
    statusBadge.textContent = isPresent ? '✅ Present' : '⏳ Pending';
    statusBadge.classList.add(isPresent ? 'active' : 'pending');

    document.getElementById('modalBonusPoints').textContent = bonusPoints;
    document.getElementById('modalTotalPoints').textContent = totalPoints;

    const attendanceModal = document.getElementById('attendanceModal');
    attendanceModal.classList.add('open');
  }

  // Close attendance modal
  function closeAttendanceModalFunc() {
    const attendanceModal = document.getElementById('attendanceModal');
    attendanceModal.classList.remove('open');
  }

  // Search functionality
  function setupSearch() {
    const searchInput = document.getElementById('searchRecords');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const attendanceList = document.getElementById('attendanceList');

      if (!query) {
        renderAttendanceRecords();
        return;
      }

      const filteredRecords = allAttendanceRecords.filter(record => {
        const session = allSessions[record.session_id] || {};
        const sessionTitle = (session.title || '').toLowerCase();
        const sessionDate = new Date(session.session_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).toLowerCase();
        
        return sessionTitle.includes(query) || sessionDate.includes(query);
      });

      if (filteredRecords.length === 0) {
        attendanceList.innerHTML = '<p style="text-align: center; color: #999;">No attendance records match your search.</p>';
        return;
      }

      const recordsHTML = filteredRecords.map(record => {
        const session = allSessions[record.session_id] || {};
        const isPresent = parseInt(record.is_present) === 1;
        const bonusPoints = parseInt(record.points_awarded || 0);
        const totalPoints = 20 + bonusPoints;

        const sessionDate = new Date(session.session_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const startTime = session.start_time || '—';
        const endTime = session.end_time || '—';

        return `
          <div class="attendance-record-card">
            <div class="record-header">
              <h3>${session.title || 'Unknown Session'}</h3>
              <span class="record-status ${isPresent ? 'status-present' : 'status-pending'}">
                ${isPresent ? '✅ Present' : '⏳ Pending'}
              </span>
            </div>
            <div class="record-details">
              <div class="detail">
                <span class="detail-icon">📅</span>
                <span>${sessionDate}</span>
              </div>
              <div class="detail">
                <span class="detail-icon">🕐</span>
                <span>${startTime} - ${endTime}</span>
              </div>
              <div class="detail">
                <span class="detail-icon">📍</span>
                <span>${session.location || '—'}</span>
              </div>
              <div class="detail">
                <span class="detail-icon">⭐</span>
                <span><strong>${totalPoints} pts</strong> (20 guaranteed + ${bonusPoints} bonus)</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      attendanceList.innerHTML = recordsHTML;
    });
  }

  // Sidebar navigation - highlight current page
  const currentPage = window.location.pathname.split('/').pop() || 'attendancerecord.html';
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage || (currentPage === '' && linkPage === 'attendancerecord.html')) {
      link.classList.add('active');
    }
  });

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.querySelector('.sidebar');
  if (mobileMenuToggle && sidebar) {
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);

    mobileMenuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('active');
    });

    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });

    // Close sidebar when clicking a link on mobile
    const sidebarLinks = sidebar.querySelectorAll('a');
    sidebarLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
          sidebarOverlay.classList.remove('active');
        }
      });
    });
  }

  // Attendance modal event listeners
  if (closeAttendanceModal) closeAttendanceModal.addEventListener('click', closeAttendanceModalFunc);
  if (closeAttendanceBtn) closeAttendanceBtn.addEventListener('click', closeAttendanceModalFunc);

  // Close modal when clicking outside
  if (attendanceModal) {
    attendanceModal.addEventListener('click', (e) => {
      if (e.target === attendanceModal) {
        closeAttendanceModalFunc();
      }
    });
  }

  // Load and display attendance records
  loadAttendanceRecords();

  // Set up periodic refresh (every 30 seconds)
  setInterval(async () => {
    await loadAttendanceRecords();
  }, 30000);
});
