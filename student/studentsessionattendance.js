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

  // Get session ID from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('id');

  if (!sessionId) {
    alert('No session selected');
    window.location.href = 'studentsession.html';
    return;
  }

  const logoutBtn = document.getElementById('logoutBtn');

  let currentSession = null;
  let attendanceRecord = null;

  // Load session details
  async function loadSessionDetails() {
    try {
      const res = await fetch(new URL('../adminphp/getsessions.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && Array.isArray(data.sessions)) {
        currentSession = data.sessions.find(s => parseInt(s.id) === parseInt(sessionId));
        if (!currentSession) {
          alert('Session not found');
          window.location.href = 'studentsession.html';
          return;
        }
      } else {
        console.error('Failed to load sessions');
        window.location.href = 'studentsession.html';
        return;
      }
    } catch (e) {
      console.error('Error loading sessions', e);
      window.location.href = 'studentsession.html';
      return;
    }

    // Load student's attendance record for this session
    await loadAttendanceRecord();
    
    // Auto-join if not already joined
    if (!attendanceRecord) {
      await autoJoinSession();
    }
    
    renderSessionInfo();
    renderAttendanceStatus();
  }

  // Load attendance record
  async function loadAttendanceRecord() {
    try {
      const res = await fetch(new URL('../studentphp/getmyattendance.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && Array.isArray(data.attendance)) {
        attendanceRecord = data.attendance.find(a => parseInt(a.session_id) === parseInt(sessionId));
      }
    } catch (e) {
      console.error('Error loading attendance', e);
    }
  }

  // Auto-join session if not already joined
  async function autoJoinSession() {
    // Check if already joined
    if (attendanceRecord) return;

    try {
      const res = await fetch(new URL('../studentphp/joinsession.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ session_id: sessionId })
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        // Reload attendance record after joining
        await loadAttendanceRecord();
      }
    } catch (err) {
      console.error('Auto-join error:', err);
    }
  }

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

  // Render session information
  function renderSessionInfo() {
    if (!currentSession) return;

    document.getElementById('sessionTitle').textContent = currentSession.title;
    document.getElementById('detailTitle').textContent = currentSession.title;
    document.getElementById('detailDate').textContent = new Date(currentSession.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('detailTime').textContent = `${currentSession.start_time} - ${currentSession.end_time}`;
    document.getElementById('detailLocation').textContent = currentSession.location;
    document.getElementById('detailDescription').textContent = currentSession.description;

    // Determine and display status
    const inProgress = isSessionInProgress(currentSession.session_date, currentSession.start_time, currentSession.end_time);
    const expired = isSessionExpired(currentSession.session_date, currentSession.end_time);
    const upcoming = isSessionUpcoming(currentSession.session_date, currentSession.start_time);

    if (inProgress) {
      document.getElementById('detailStatus').textContent = '🔴 In Progress';
    } else if (expired) {
      document.getElementById('detailStatus').textContent = '⏳ Expired';
    } else if (upcoming) {
      document.getElementById('detailStatus').textContent = '📅 Upcoming';
    }
  }

  // Render attendance status
  function renderAttendanceStatus() {
    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    const statusMessage = document.getElementById('statusMessage');
    const bonusPoints = document.getElementById('bonusPoints');
    const bonusNote = document.getElementById('bonusNote');
    const totalEarnedPoints = document.getElementById('totalEarnedPoints');

    if (!attendanceRecord) {
      // Waiting for admin to mark present
      statusIcon.textContent = '⏳';
      statusTitle.textContent = 'Awaiting Admin Confirmation';
      statusMessage.textContent = 'Your attendance has been registered. The admin will mark your presence in the session and award bonus points.';
      bonusPoints.textContent = '0';
      bonusNote.textContent = 'Waiting for admin to award bonus points';
      totalEarnedPoints.textContent = '20';
      return;
    }

    const isPresent = parseInt(attendanceRecord.is_present) === 1;
    const adminBonusPoints = parseInt(attendanceRecord.points_awarded || 0);
    const totalPoints = 20 + adminBonusPoints;

    if (isPresent) {
      // Admin has marked present
      statusIcon.textContent = '✅';
      statusTitle.textContent = 'Present';
      statusMessage.textContent = 'The admin has confirmed your attendance for this session.';
    } else {
      // Pending admin confirmation
      statusIcon.textContent = '⏳';
      statusTitle.textContent = 'Awaiting Confirmation';
      statusMessage.textContent = 'Your attendance has been registered. The admin will mark your presence in the session and award bonus points.';
    }

    // Update bonus points display
    bonusPoints.textContent = adminBonusPoints;
    bonusNote.textContent = adminBonusPoints > 0 
      ? `${adminBonusPoints} points awarded by admin` 
      : 'Waiting for admin to award bonus points';
    totalEarnedPoints.textContent = totalPoints;
    
    // Debug log
    console.log('Attendance Record:', attendanceRecord);
    console.log('Admin Bonus Points:', adminBonusPoints);
    console.log('Total Points:', totalPoints);
  }

  // Set up periodic refresh (every 30 seconds to check for admin updates)
  setInterval(async () => {
    await loadAttendanceRecord();
    renderAttendanceStatus();
  }, 30000);

  // Sidebar navigation - highlight current page
  const currentPage = window.location.pathname.split('/').pop() || 'studentsessionattendance.html';
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage || (currentPage === '' && linkPage === 'studentsessionattendance.html')) {
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

  // Load and display session details
  loadSessionDetails();
});
