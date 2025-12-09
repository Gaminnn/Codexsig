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

  const totalMembersEl = document.getElementById('totalMembers');
  const pendingApprovalsEl = document.getElementById('pendingApprovals');
  const announcementTodayEl = document.getElementById('announcementToday');
  const todaySessionCard = document.getElementById('todaySessionCard');
  const todaySessionTitle = document.getElementById('todaySessionTitle');
  const todaySessionTime = document.getElementById('todaySessionTime');
  const memberOverviewTableBody = document.getElementById('memberOverviewTableBody');
  const leaderboardList = document.getElementById('leaderboardList');
  const memberOverviewSearch = document.getElementById('memberOverviewSearch');
  const filterProgramOverview = document.getElementById('filterProgramOverview');
  const filterStatusOverview = document.getElementById('filterStatusOverview');
  const clearFiltersOverview = document.getElementById('clearFiltersOverview');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.querySelector('.sidebar');
  const memberModal = document.getElementById('memberModal');
  const closeMemberModal = document.getElementById('closeMemberModal');
  const closeMemberDetailsBtn = document.getElementById('closeMemberDetailsBtn');
  const memberDetails = document.getElementById('memberDetails');
  const editMemberModal = document.getElementById('editMemberModal');
  const closeEditMemberModal = document.getElementById('closeEditMemberModal');
  const cancelEditMemberBtn = document.getElementById('cancelEditMemberBtn');
  const submitEditMemberBtn = document.getElementById('submitEditMemberBtn');
  const editMemberName = document.getElementById('editMemberName');
  const editMemberEmail = document.getElementById('editMemberEmail');
  const editMemberStudentNumber = document.getElementById('editMemberStudentNumber');
  const editMemberProgram = document.getElementById('editMemberProgram');
  const editMemberStatus = document.getElementById('editMemberStatus');
  const editMemberParticipation = document.getElementById('editMemberParticipation');
  const editMemberPoints = document.getElementById('editMemberPoints');

  let members = [];
  let memberToEdit = null;
  let pending = [];

  function deriveStatus(member) {
    if (member.status === 'suspended') return 'Suspended';
    const participationVal = parseFloat(member.participation ?? '0');
    return participationVal > 50 ? 'Active' : 'Inactive';
  }

  async function loadMembers() {
    try {
      const res = await fetch(new URL('../adminphp/getmembers.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && Array.isArray(data.members)) {
        members = data.members;
      } else {
        console.error('Failed to load members', res.status, data);
        members = [];
      }
    } catch (e) {
      console.error('Error loading members', e);
      members = [];
    }
  }

  async function loadPending() {
    try {
      const res = await fetch(new URL('../adminphp/getpending.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && Array.isArray(data.pending)) {
        pending = data.pending;
      } else {
        console.error('Failed to load pending approvals', res.status, data);
        pending = [];
      }
    } catch (e) {
      console.error('Error loading pending approvals', e);
      pending = [];
    }
  }

  async function loadTodaySessions() {
    try {
      const res = await fetch(new URL('../adminphp/getsessions.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && Array.isArray(data.sessions)) {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        return data.sessions.filter(s => s.session_date === today && parseInt(s.is_active) === 1);
      }
      return [];
    } catch (e) {
      console.error('Error loading today sessions', e);
      return [];
    }
  }

  async function loadTodayAnnouncements() {
    try {
      const res = await fetch(new URL('../adminphp/getannouncements.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && Array.isArray(data.announcements)) {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        return data.announcements.filter(a => a.created_at && a.created_at.startsWith(today) && parseInt(a.is_active) === 1);
      }
      return [];
    } catch (e) {
      console.error('Error loading today announcements', e);
      return [];
    }
  }

  async function updateStats() {
    await Promise.all([
      loadMembers(),
      loadPending()
    ]);
    
    const totalMembers = members.length;
    const pendingApprovals = pending.length;
    
    console.log('Loaded data:', { totalMembers, pendingApprovals, membersCount: members.length, pendingCount: pending.length });
    
    if (totalMembersEl) totalMembersEl.textContent = totalMembers;
    if (pendingApprovalsEl) pendingApprovalsEl.textContent = pendingApprovals;
    
    // Load and display today's sessions
    const todaySessions = await loadTodaySessions();
    if (todaySessions.length > 0) {
      const session = todaySessions[0];
      if (todaySessionTitle) todaySessionTitle.textContent = session.title;
      if (todaySessionTime) todaySessionTime.textContent = `${session.start_time} - ${session.end_time}`;
      if (todaySessionCard) {
        todaySessionCard.style.cursor = 'pointer';
        todaySessionCard.classList.add('clickable-stat');
        todaySessionCard.dataset.sessionId = session.id;
      }
    } else {
      if (todaySessionTitle) todaySessionTitle.textContent = 'No session today';
      if (todaySessionTime) todaySessionTime.textContent = '—';
      if (todaySessionCard) {
        todaySessionCard.style.cursor = 'default';
        todaySessionCard.classList.remove('clickable-stat');
        delete todaySessionCard.dataset.sessionId;
      }
    }
    
    // Load and display today's announcements
    const todayAnnouncements = await loadTodayAnnouncements();
    if (announcementTodayEl) announcementTodayEl.textContent = todayAnnouncements.length;
    
    const searchTerm = memberOverviewSearch ? memberOverviewSearch.value : '';
    const programFilter = filterProgramOverview ? filterProgramOverview.value : 'all';
    const statusFilter = filterStatusOverview ? filterStatusOverview.value : 'all';
    renderMemberOverview(members, searchTerm, programFilter, statusFilter);
    renderLeaderboard(members);
  }

  function renderLeaderboard(list) {
    if (!leaderboardList) return;
    if (!list.length) {
      leaderboardList.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:16px;">
            <span class="helper-text">No members yet.</span>
          </td>
        </tr>
      `;
      return;
    }
    const topMembers = list
      .map(m => ({ ...m, points: parseFloat(m.points ?? 0) || 0 }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
    leaderboardList.innerHTML = topMembers.map((member, idx) => `
      <tr data-id="${member.id}">
        <td><strong>#${idx + 1}</strong></td>
        <td>${member.name}</td>
        <td>${member.studentNumber}</td>
        <td>${member.program}</td>
        <td><strong>${member.points}</strong></td>
      </tr>
    `).join('');
  }

  function renderMemberOverview(list, searchTerm = '', programFilter = 'all', statusFilter = 'all') {
    if (!memberOverviewTableBody) return;
    const term = searchTerm.trim().toLowerCase();
    let filtered = list.filter(m => m && m.name && m.studentNumber);
    if (term) {
      filtered = filtered.filter(m =>
        (m.name && m.name.toLowerCase().includes(term)) ||
        (m.studentNumber && m.studentNumber.toLowerCase().includes(term)) ||
        (m.email && m.email.toLowerCase().includes(term)) ||
        (m.program && m.program.toLowerCase().includes(term))
      );
    }
    if (programFilter !== 'all') {
      filtered = filtered.filter(m => m.program === programFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => deriveStatus(m) === statusFilter);
    }
    if (!filtered.length) {
      memberOverviewTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:16px;">
            <span class="helper-text">No members found.</span>
          </td>
        </tr>
      `;
      return;
    }

    const display = filtered.slice(0, 10);

    memberOverviewTableBody.innerHTML = display.map(member => {
      const statusVal = deriveStatus(member);
      const statusClass = `status-pill ${statusVal === 'Active' ? 'active' : statusVal === 'Suspended' ? 'pending' : 'inactive'}`;
      return `
        <tr data-id="${member.id}">
          <td>${member.name}</td>
          <td>${member.studentNumber}</td>
          <td>${getProgramAbbreviation(member.program)}</td>
          <td><span class="${statusClass}">${statusVal}</span></td>
          <td>${member.participation ?? 0}%</td>
          <td>${member.points ?? 0}</td>
          <td>
            <div class="member-actions">
              <button class="btn btn-outline btn-sm" data-action="view-member" data-id="${member.id}">View</button>
              <button class="btn btn-outline btn-sm" data-action="edit-member" data-id="${member.id}">Edit</button>
              <button class="btn btn-outline btn-sm" data-action="toggle-status" data-id="${member.id}">${statusVal === 'Suspended' ? 'Unsuspend' : 'Suspend'}</button>
              <button class="btn btn-danger btn-sm" data-action="delete-member" data-id="${member.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (filtered.length > 10) {
      memberOverviewTableBody.innerHTML += `
        <tr>
          <td colspan="7" style="text-align:center; padding:12px; color:#666;">
            Showing 10 of ${filtered.length} members. <a href="adminmembers.html" style="color:#9e2a2b; text-decoration:none;">View all →</a>
          </td>
        </tr>
      `;
    }
  }

  if (memberOverviewSearch) {
    memberOverviewSearch.addEventListener('input', () => {
      const searchTerm = memberOverviewSearch.value;
      const programFilter = filterProgramOverview ? filterProgramOverview.value : 'all';
      const statusFilter = filterStatusOverview ? filterStatusOverview.value : 'all';
      renderMemberOverview(members, searchTerm, programFilter, statusFilter);
    });
  }
  if (filterProgramOverview) {
    filterProgramOverview.addEventListener('change', () => {
      const searchTerm = memberOverviewSearch ? memberOverviewSearch.value : '';
      const programFilter = filterProgramOverview.value;
      const statusFilter = filterStatusOverview ? filterStatusOverview.value : 'all';
      renderMemberOverview(members, searchTerm, programFilter, statusFilter);
    });
  }
  if (filterStatusOverview) {
    filterStatusOverview.addEventListener('change', () => {
      const searchTerm = memberOverviewSearch ? memberOverviewSearch.value : '';
      const programFilter = filterProgramOverview ? filterProgramOverview.value : 'all';
      const statusFilter = filterStatusOverview.value;
      renderMemberOverview(members, searchTerm, programFilter, statusFilter);
    });
  }
  if (clearFiltersOverview) {
    clearFiltersOverview.addEventListener('click', () => {
      if (memberOverviewSearch) memberOverviewSearch.value = '';
      if (filterProgramOverview) filterProgramOverview.value = 'all';
      if (filterStatusOverview) filterStatusOverview.value = 'all';
      renderMemberOverview(members, '', 'all', 'all');
    });
  }

  if (memberOverviewTableBody) {
    memberOverviewTableBody.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const action = button.dataset.action;
      const id = button.dataset.id;
      if (action === 'view-member') {
        showMemberModal(id);
      } else if (action === 'edit-member') {
        showEditMemberModal(id);
      } else if (action === 'toggle-status') {
        await handleToggleStatus(id);
      } else if (action === 'delete-member') {
        await handleDeleteMember(id);
      }
    });
  }

  if (closeMemberModal) {
    closeMemberModal.addEventListener('click', closeMemberDetails);
  }

  if (closeMemberDetailsBtn) {
    closeMemberDetailsBtn.addEventListener('click', closeMemberDetails);
  }

  if (closeEditMemberModal) {
    closeEditMemberModal.addEventListener('click', closeEditMemberModalFunc);
  }

  if (cancelEditMemberBtn) {
    cancelEditMemberBtn.addEventListener('click', closeEditMemberModalFunc);
  }

  if (submitEditMemberBtn) {
    submitEditMemberBtn.addEventListener('click', handleEditMember);
  }

  function getProgramAbbreviation(program) {
    if (!program) return 'N/A';
    if (program === 'BS Computer Science') return 'BSCS';
    if (program === 'BS Information Technology') return 'BSIT';
    if (program === 'BS Information Systems') return 'BSIS';
    return program;
  }

  function getYearFromStudentNumber(studentNumber) {
    if (!studentNumber) return '—';
    // Student number format: YYMM-XXXX (e.g., 2223-1234 means year 22 = 2nd year)
    // Extract first 2 digits which represent the year within CODEX timeline
    const yearCode = studentNumber.substring(0, 2);
    // Map: 20=0th, 21=1st, 22=2nd, 23=3rd, 24=4th
    const yearMap = { '20': '0th', '21': '1st', '22': '2nd', '23': '3rd', '24': '4th' };
    return yearMap[yearCode] || '—';
  }

  function showMemberModal(memberId) {
    const member = members.find(m => m.id == memberId);
    if (!member) return;

    const statusVal = deriveStatus(member);
    const year = getYearFromStudentNumber(member.studentNumber);

    memberDetails.innerHTML = `
      <div style="line-height: 1.8;">
        <p><strong>Name:</strong> ${member.name || 'N/A'}</p>
        <p><strong>Student Number:</strong> ${member.studentNumber || 'N/A'}</p>
        <p><strong>Email:</strong> ${member.email || 'N/A'}</p>
        <p><strong>Program:</strong> ${member.program || 'N/A'}</p>
        <p><strong>Year:</strong> ${year}</p>
        <p><strong>Status:</strong> <span class="role-badge ${statusVal === 'Active' ? 'active' : statusVal === 'Suspended' ? 'pending' : 'inactive'}">${statusVal}</span></p>
        <p><strong>Participation:</strong> ${member.participation ?? '—'}%</p>
        <p><strong>Points:</strong> ${member.points ?? '0'}</p>
      </div>
    `;

    memberModal.classList.add('open');
  }

  function closeMemberDetails() {
    memberModal.classList.remove('open');
  }

  function showEditMemberModal(memberId) {
    const member = members.find(m => m.id == memberId);
    if (!member) return;
    memberToEdit = member;
    if (editMemberName) editMemberName.value = member.name || '';
    if (editMemberEmail) editMemberEmail.value = member.email || '';
    if (editMemberStudentNumber) editMemberStudentNumber.value = member.studentNumber || '';
    if (editMemberProgram) editMemberProgram.value = member.program || '';
    if (editMemberStatus) editMemberStatus.value = member.status || 'pending';
    if (editMemberParticipation) editMemberParticipation.value = member.participation ?? '0';
    if (editMemberPoints) editMemberPoints.value = member.points ?? '0';
    if (editMemberModal) editMemberModal.classList.add('open');
  }

  function closeEditMemberModalFunc() {
    if (editMemberModal) editMemberModal.classList.remove('open');
    memberToEdit = null;
  }

  async function handleEditMember() {
    if (!memberToEdit) return;
    const name = editMemberName?.value.trim() || '';
    const email = editMemberEmail?.value.trim() || '';
    const studentNumber = editMemberStudentNumber?.value.trim() || '';
    const program = editMemberProgram?.value.trim() || '';
    const status = editMemberStatus?.value || 'pending';
    const participation = editMemberParticipation?.value || '0';
    const points = editMemberPoints?.value || '0';

    if (!name || !email || !studentNumber || !program) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const res = await fetch(new URL('../adminphp/editmember.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          id: memberToEdit.id,
          name,
          email,
          studentNumber,
          program,
          status,
          participation,
          points
        })
      });
      const raw = await res.text();
      let data = null;
      try { data = JSON.parse(raw); } catch (_) {}
      if (!res.ok || !data?.success) {
        const msg = data?.message || raw || 'Failed to update member.';
        alert(msg);
        return;
      }
      alert('Member updated successfully.');
      closeEditMemberModalFunc();
      await updateStats();
    } catch (err) {
      console.error('Edit member error:', err);
      alert('Could not reach server. Please try again.');
    }
  }

  async function handleToggleStatus(memberId) {
    const member = members.find(m => m.id == memberId);
    if (!member) return;
    const newStatus = member.status === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch(new URL('../adminphp/editmember.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          id: member.id,
          name: member.name || '',
          email: member.email || '',
          studentNumber: member.studentNumber || '',
          program: member.program || '',
          status: newStatus,
          participation: member.participation ?? '0',
          points: member.points ?? '0'
        })
      });
      const raw = await res.text();
      let data = null;
      try { data = JSON.parse(raw); } catch (_) {}
      if (!res.ok || !data?.success) {
        const msg = data?.message || raw || 'Failed to update status.';
        alert(msg);
        return;
      }
      alert(`Member ${newStatus === 'suspended' ? 'suspended' : 'unsuspended'} successfully.`);
      await updateStats();
    } catch (err) {
      console.error('Toggle status error:', err);
      alert('Could not reach server. Please try again.');
    }
  }

  async function handleDeleteMember(memberId) {
    if (!confirm('Delete this member? This cannot be undone.')) return;
    try {
      const res = await fetch(new URL('../adminphp/deletemember.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id: memberId })
      });
      const raw = await res.text();
      let data = null;
      try { data = JSON.parse(raw); } catch (_) {}
      if (!res.ok || !data?.success) {
        const msg = data?.message || raw || 'Failed to delete member.';
        alert(msg);
        return;
      }
      alert('Member deleted successfully.');
      await updateStats();
    } catch (err) {
      console.error('Delete member error:', err);
      alert('Could not reach server. Please try again.');
    }
  }

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
  window.addEventListener('click', (e) => {
    if (e.target === memberModal) closeMemberDetails();
    if (e.target === editMemberModal) closeEditMemberModalFunc();
  });

  // Navigation links should work with simple relative paths like superadmin
  // No need to modify them - they're already correct in HTML

  // Initial load
  updateStats();
});