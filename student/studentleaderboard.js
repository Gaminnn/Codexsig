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

  const logoutBtn = document.getElementById('logoutBtn');
  const leaderboardBody = document.getElementById('leaderboardBody');
  let allMembers = [];

  // Load leaderboard data
  async function loadLeaderboard() {
    try {
      const res = await fetch(new URL('../studentphp/getleaderboard.php', window.location.href).href, { credentials: 'same-origin' });
      console.log('Leaderboard fetch response status:', res.status);
      const data = await res.json().catch(() => null);
      console.log('Leaderboard data:', data);
      allMembers = (data?.success && Array.isArray(data.members)) ? data.members : [];
      console.log('Leaderboard members loaded:', allMembers.length);
      displayLeaderboard();
      updateYourRanking();
    } catch (e) {
      console.error('Error loading leaderboard', e);
      leaderboardBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Error loading leaderboard: ' + e.message + '</td></tr>';
    }
  }

  // Display leaderboard
  function displayLeaderboard() {
    const sorted = [...allMembers].sort((a, b) => parseInt(b.points || 0) - parseInt(a.points || 0));
    const topTen = sorted.slice(0, 10);

    if (topTen.length === 0) {
      leaderboardBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No members found</td></tr>';
      return;
    }

    leaderboardBody.innerHTML = topTen.map((member, index) => `
      <tr ${member.email === sessionUser.email ? 'class="current-user-row"' : ''}>
        <td><strong>${index + 1}${index === 0 ? ' 🥇' : index === 1 ? ' 🥈' : index === 2 ? ' 🥉' : ''}</strong></td>
        <td><strong>${member.name}</strong></td>
        <td>${member.studentNumber}</td>
        <td>${member.program}</td>
        <td><strong>${member.points}</strong></td>
        <td>${member.participation.toFixed(2)}%</td>
      </tr>
    `).join('');
  }

  // Update user's ranking (show actual rank for all members)
  function updateYourRanking() {
    const yourRankEl = document.getElementById('yourRank');
    const yourPointsEl = document.getElementById('yourPoints');
    const yourAttendanceEl = document.getElementById('yourAttendance');

    const sorted = [...allMembers].sort((a, b) => parseInt(b.points || 0) - parseInt(a.points || 0));
    const yourRankIndex = sorted.findIndex(m => m.email === sessionUser.email);
    const yourData = yourRankIndex !== -1 ? sorted[yourRankIndex] : null;

    if (yourData) {
      const rank = yourRankIndex + 1;
      yourRankEl.textContent = `#${rank}`;
      yourPointsEl.textContent = yourData.points;
      yourAttendanceEl.textContent = parseFloat(yourData.participation || 0).toFixed(2) + '%';
    } else {
      yourRankEl.textContent = '—';
      yourPointsEl.textContent = '0';
      yourAttendanceEl.textContent = '0%';
    }
  }

  // Filter buttons - removed, using single sorted view
  
  // Sidebar navigation
  const currentPage = window.location.pathname.split('/').pop() || 'studentleaderboard.html';
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage || (currentPage === '' && linkPage === 'studentleaderboard.html')) {
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

  // Load initial data
  loadLeaderboard();
});
