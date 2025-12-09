document.addEventListener('DOMContentLoaded', async () => {
  // Fetch session user
  let sessionUser = null;
  try {
    const res = await fetch(new URL('../session_user.php', window.location.href).href, { credentials: 'same-origin' });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success && data.role === 'student' && data.user) {
      sessionUser = data.user;
    } else {
      window.location.href = '../loginpage/login.html';
      return;
    }
  } catch (e) {
    window.location.href = '../loginpage/login.html';
    return;
  }

  const studentData = sessionUser || {};
  const userName = studentData.name || 'Student';
  // heartbeat to mark online
  function sendHeartbeat() {
    fetch(new URL('../heartbeat.php', window.location.href).href, {
      method: 'POST',
      credentials: 'same-origin'
    }).catch(() => {});
  }
  sendHeartbeat();
  setInterval(sendHeartbeat, 120000);

  const welcomeMessage = document.getElementById('welcomeMessage');
  if (welcomeMessage) {
    welcomeMessage.textContent = `Welcome back, ${userName}!`;
  }

  // Update account status with student data
  const studentNameEl = document.getElementById('studentName');
  const membershipTypeEl = document.getElementById('membershipType');
  const studentNumberEl = document.getElementById('studentNumber');
  const studentProgramEl = document.getElementById('studentProgram');
  const yearLevelEl = document.getElementById('yearLevel');
  const joinedDateEl = document.getElementById('joinedDate');
  
  if (studentNameEl) {
    studentNameEl.textContent = userName;
  }
  
  if (membershipTypeEl) {
    membershipTypeEl.textContent = 'CODEX SIG';
  }
  
  if (studentNumberEl && studentData.studentNumber) {
    studentNumberEl.textContent = studentData.studentNumber;
  }
  
  if (studentProgramEl && studentData.program) {
    studentProgramEl.textContent = studentData.program;
  }
  
  if (yearLevelEl && studentData.yearLevel) {
    yearLevelEl.textContent = studentData.yearLevel;
  } else if (yearLevelEl) {
    yearLevelEl.textContent = '—';
  }
  
  if (joinedDateEl && studentData.createdDate) {
    joinedDateEl.textContent = studentData.createdDate;
  } else if (joinedDateEl && studentData.created_at) {
    const dateObj = new Date(studentData.created_at);
    joinedDateEl.textContent = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } else if (joinedDateEl) {
    joinedDateEl.textContent = '—';
  }

  // Update member status badge with appropriate color based on status
  const memberStatusEl = document.getElementById('memberStatus');
  if (memberStatusEl && studentData.status) {
    const statusValue = studentData.status.toLowerCase();
    const statusLabels = {
      'active': 'Active Member',
      'suspended': 'Suspended',
      'inactive': 'Inactive'
    };
    
    memberStatusEl.textContent = statusLabels[statusValue] || 'Active Member';
    memberStatusEl.className = `status-badge status-${statusValue}`;
  }

  // Navigation
  const overviewLink = document.querySelector('.sidebar-nav a[href="#overview"]');
  if (overviewLink) overviewLink.classList.add('active');

  // Right rail elements
  const sessionList = document.getElementById('sessionList');
  const announcementList = document.getElementById('announcementList');
  const nextSessionDate = document.getElementById('nextSessionDate');
  const nextSessionTitle = document.getElementById('nextSessionTitle');
  const announcementCount = document.getElementById('announcementCount');
  const participationRate = document.getElementById('participationRate');
  const logoutBtn = document.getElementById('logoutBtn');
  const refreshAnnouncements = document.getElementById('refreshAnnouncements');

  // Load sessions and announcements from database
  let sessions = [];
  let announcements = [];
  let myAttendance = [];
  let memberData = null;
  let leaderboardMembers = [];

  // Load leaderboard data
  async function loadLeaderboardData() {
    try {
      const res = await fetch(new URL('../studentphp/getleaderboard.php', window.location.href).href, { credentials: 'same-origin' });
      console.log('Leaderboard fetch status:', res.status);
      const data = await res.json().catch(() => null);
      console.log('Leaderboard data response:', data);
      leaderboardMembers = (data?.success && Array.isArray(data.members)) ? data.members : [];
      console.log('Leaderboard members count:', leaderboardMembers.length);
      return leaderboardMembers;
    } catch (e) {
      console.error('Error loading leaderboard', e);
      return [];
    }
  }

  // Load and update dashboard
  async function updateDashboard() {
    try {
      const sessionsRes = await fetch(new URL('../adminphp/getsessions.php', window.location.href).href, { credentials: 'same-origin' });
      const sessionsData = await sessionsRes.json().catch(() => null);
      sessions = (sessionsData?.success && Array.isArray(sessionsData.sessions)) ? sessionsData.sessions : [];

      const announcementsRes = await fetch(new URL('../adminphp/getannouncements.php', window.location.href).href, { credentials: 'same-origin' });
      const announcementsData = await announcementsRes.json().catch(() => null);
      announcements = (announcementsData?.success && Array.isArray(announcementsData.announcements)) ? announcementsData.announcements : [];

      const attendanceRes = await fetch(new URL('../studentphp/getmyattendance.php', window.location.href).href, { credentials: 'same-origin' });
      const attendanceData = await attendanceRes.json().catch(() => null);
      myAttendance = (attendanceData?.success && Array.isArray(attendanceData.attendance)) ? attendanceData.attendance : [];

      // Fetch current member data to get points from database
      const memberRes = await fetch(new URL('../studentphp/getmemberdata.php', window.location.href).href, { credentials: 'same-origin' });
      const memberDataResponse = await memberRes.json().catch(() => null);
      memberData = (memberDataResponse?.success && memberDataResponse.member) ? memberDataResponse.member : null;
      
      console.log('Member data fetch result:', memberDataResponse);
      console.log('Member data assigned:', memberData);
      
      // Fetch leaderboard data to calculate ranking
      await loadLeaderboardData();
      
      // If memberData fetch fails, use data from sessionUser as fallback
      if (!memberData && sessionUser) {
        console.log('Using session user as fallback');
        memberData = sessionUser;
      }
    } catch (e) {
      console.error('Error loading data from database', e);
      sessions = [];
      announcements = [];
      myAttendance = [];
      // Use session user data as fallback
      if (sessionUser) {
        console.log('Error occurred, using session user as fallback');
        memberData = sessionUser;
      } else {
        memberData = null;
      }
    }

    // Update next session
    if (nextSessionDate && nextSessionTitle) {
      if (sessions.length > 0) {
        const now = new Date();
        const futureSessions = sessions
          .slice()
          .sort((a, b) => new Date(`${a.session_date}T${a.start_time}`) - new Date(`${b.session_date}T${b.start_time}`))
          .filter(session => new Date(`${session.session_date}T${session.start_time}`) >= now);
        
        if (futureSessions.length > 0) {
          const nextSession = futureSessions[0];
          const date = new Date(nextSession.session_date);
          nextSessionDate.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          nextSessionTitle.textContent = nextSession.title;
        } else {
          nextSessionDate.textContent = 'No upcoming sessions';
          nextSessionTitle.textContent = 'Check back later';
        }
      } else {
        nextSessionDate.textContent = 'No upcoming sessions';
        nextSessionTitle.textContent = 'Check back later';
      }
    }

    // Update right rail session list
    if (sessionList) {
      if (sessions.length > 0) {
        sessionList.innerHTML = sessions.slice(0, 3).map(session =>
          `<li><strong>${session.session_date}</strong> – ${session.title}</li>`
        ).join('');
      } else {
        sessionList.innerHTML = '<li>No sessions scheduled</li>';
      }
    }

    // Update announcements count and right rail
    function updateAnnouncements() {
      // Count unread announcements
      const unreadCount = announcements.filter(a => parseInt(a.is_seen || 0) === 0).length;
      
      if (announcementCount) {
        announcementCount.textContent = unreadCount || 0;
      }
      
      if (announcementList) {
        if (announcements.length > 0) {
          const sortedAnnouncements = announcements.slice().sort((a, b) => {
            const aTime = new Date(a.published_date).getTime();
            const bTime = new Date(b.published_date).getTime();
            return bTime - aTime; // Newest first
          });
          announcementList.innerHTML = sortedAnnouncements.slice(0, 3).map(item => {
            const date = new Date(item.published_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `<li><strong>${item.title}</strong> <span>${date}</span></li>`;
          }).join('');
        } else {
          announcementList.innerHTML = '<li>No announcements</li>';
        }
      }
    }
    
    updateAnnouncements();

    // Update Account Status with fetched data
    function updateAccountStatus() {
      const yearLevelEl = document.getElementById('yearLevel');
      const joinedDateEl = document.getElementById('joinedDate');
      
      if (memberData) {
        // Update Year Level from members table
        if (yearLevelEl) {
          yearLevelEl.textContent = memberData.year || '—';
        }
        
        // Update Joined Date from members table created_at
        if (joinedDateEl) {
          if (memberData.created_at) {
            const dateObj = new Date(memberData.created_at);
            joinedDateEl.textContent = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          } else {
            joinedDateEl.textContent = '—';
          }
        }
        
        console.log('Account status updated with memberData:', memberData);
      } else {
        // Set defaults if memberData not available
        if (yearLevelEl) yearLevelEl.textContent = '—';
        if (joinedDateEl) joinedDateEl.textContent = '—';
      }
    }

    // Calculate participation statistics
    function calculateParticipationStats() {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      let totalPoints = 0;
      let sessionsAttendedCount = 0;
      let monthlyAttended = 0;
      
      // Count sessions attended
      myAttendance.forEach(record => {
        const isPresent = parseInt(record.is_present) === 1;
        if (isPresent) {
          sessionsAttendedCount++;
          totalPoints += 20; // Guaranteed points
          totalPoints += parseInt(record.points_awarded || 0); // Bonus points
          
          // Check if in current month
          const sessionDate = new Date(record.session_date);
          if (sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear) {
            monthlyAttended++;
          }
        }
      });
      
      // Count total sessions in current month
      const monthlyTotal = sessions.filter(session => {
        const sessionDate = new Date(session.session_date);
        return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
      }).length;
      
      // Calculate monthly rate
      const monthlyRate = monthlyTotal > 0 ? Math.round((monthlyAttended / monthlyTotal) * 100) : 0;
      
      // Calculate attendance rate
      const totalSessions = sessions.length;
      const attendanceRate = totalSessions > 0 ? Math.round((sessionsAttendedCount / totalSessions) * 100) : 0;
      
      // Update UI
      const sessionsAttendedEl = document.getElementById('sessionsAttended');
      const sessionsProgressEl = document.getElementById('sessionsProgress');
      const sessionsHelperEl = document.getElementById('sessionsHelper');
      const monthlyRateEl = document.getElementById('monthlyRate');
      const monthlyProgressEl = document.getElementById('monthlyProgress');
      const monthlyHelperEl = document.getElementById('monthlyHelper');
      const participationRateEl = document.getElementById('participationRate');
      
      if (sessionsAttendedEl) {
        sessionsAttendedEl.textContent = `${sessionsAttendedCount} / ${totalSessions}`;
      }
      if (sessionsProgressEl) {
        sessionsProgressEl.style.width = `${attendanceRate}%`;
      }
      if (sessionsHelperEl) {
        if (attendanceRate >= 100) {
          sessionsHelperEl.textContent = 'Perfect attendance!';
        } else if (attendanceRate >= 80) {
          sessionsHelperEl.textContent = `Attend ${totalSessions - sessionsAttendedCount} more sessions to reach 100%`;
        } else {
          sessionsHelperEl.textContent = 'Keep attending sessions to improve your rate';
        }
      }
      
      if (monthlyRateEl) {
        monthlyRateEl.textContent = `${monthlyRate}%`;
      }
      if (monthlyProgressEl) {
        monthlyProgressEl.style.width = `${monthlyRate}%`;
      }
      if (monthlyHelperEl) {
        if (monthlyRate >= 80) {
          monthlyHelperEl.textContent = 'Great job staying active this month';
        } else if (monthlyRate >= 50) {
          monthlyHelperEl.textContent = 'Good progress, keep it up!';
        } else {
          monthlyHelperEl.textContent = 'Try to attend more sessions';
        }
      }
      
      if (participationRateEl) {
        participationRateEl.textContent = `${attendanceRate}%`;
      }

      // Update total points overall and attendance rate
      const studentRankEl = document.getElementById('studentRank');
      const rankHelperEl = document.getElementById('rankHelper');
      const totalPointsOverallEl = document.getElementById('totalPointsOverall');
      const attendanceRateEl = document.getElementById('attendanceRate');

      // Calculate Rank from leaderboard data (all members) - same as leaderboard page
      if (studentRankEl && leaderboardMembers.length > 0 && sessionUser) {
        const sorted = [...leaderboardMembers].sort((a, b) => parseInt(b.points || 0) - parseInt(a.points || 0));
        const rankIndex = sorted.findIndex(m => m.email === sessionUser.email);
        
        if (rankIndex !== -1) {
          const rank = rankIndex + 1;
          const studentData = sorted[rankIndex];
          studentRankEl.textContent = `#${rank}`;
          if (rankHelperEl) {
            rankHelperEl.textContent = '—';
          }
          
          // Update Attendance Rate from leaderboard data (members table participation)
          if (attendanceRateEl) {
            attendanceRateEl.textContent = (parseFloat(studentData.participation || 0)).toFixed(2) + '%';
          }
          
          // Update Total Points Overall from student data in leaderboard
          if (totalPointsOverallEl) {
            totalPointsOverallEl.textContent = studentData.points;
          }
        }
      } else if (memberData && attendanceRateEl) {
        // Fallback: If not in leaderboard, get from memberData
        console.log('Getting data from memberData');
        attendanceRateEl.textContent = (parseFloat(memberData.participation || 0)).toFixed(2) + '%';
        
        if (totalPointsOverallEl) {
          totalPointsOverallEl.textContent = memberData.points || '0';
        }
      } else {
        // Default fallback
        if (attendanceRateEl) {
          attendanceRateEl.textContent = '0%';
        }
        if (totalPointsOverallEl) {
          totalPointsOverallEl.textContent = '0';
        }
      }
    }
    
    // Update Account Status with fetched member data
    updateAccountStatus();
    
    // Calculate and display participation stats
    calculateParticipationStats();
  }

  // Initialize dashboard on page load
  updateDashboard();
  
  // Set up periodic refresh every 60 seconds
  setInterval(() => {
    updateDashboard();
  }, 60000);

  if (refreshAnnouncements) {
    refreshAnnouncements.addEventListener('click', () => {
      refreshAnnouncements.textContent = 'Refreshing...';
      updateDashboard();
      setTimeout(() => {
        refreshAnnouncements.textContent = 'Refresh';
        alert('Announcements refreshed!');
      }, 1000);
    });
  }

  // Schedule filtering
  const filterButtons = document.querySelectorAll('.filter-btn');
  const scheduleItems = document.querySelectorAll('.schedule-item');
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filter = btn.getAttribute('data-filter');
      
      scheduleItems.forEach(item => {
        if (filter === 'all' || item.getAttribute('data-type') === filter) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Sidebar navigation - highlight current page
  const currentPage = window.location.pathname.split('/').pop() || 'studentdashboard.html';
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage || (currentPage === '' && linkPage === 'studentdashboard.html')) {
      link.classList.add('active');
    }
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
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
});

