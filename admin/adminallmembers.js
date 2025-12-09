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

  const memberTableBody = document.getElementById('memberTableBody');
  const memberSearch = document.getElementById('memberSearch');
  const filterProgram = document.getElementById('filterProgram');
  const filterStatus = document.getElementById('filterStatus');
  const filterYear = document.getElementById('filterYear');
  const clearFilters = document.getElementById('clearFilters');
  const exportBtn = document.getElementById('exportBtn');
  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const viewMemberModal = document.getElementById('viewMemberModal');
  const closeViewMemberModal = document.getElementById('closeViewMemberModal');
  const closeViewMemberBtn = document.getElementById('closeViewMemberBtn');
  const memberDetails = document.getElementById('memberDetails');
  const editMemberModal = document.getElementById('editMemberModal');
  const closeEditMemberModal = document.getElementById('closeEditMemberModal');
  const cancelEditMemberBtn = document.getElementById('cancelEditMemberBtn');
  const submitEditMemberBtn = document.getElementById('submitEditMemberBtn');
  const editMemberName = document.getElementById('editMemberName');
  const editMemberEmail = document.getElementById('editMemberEmail');
  const editMemberStudentNumber = document.getElementById('editMemberStudentNumber');
  const editMemberProgram = document.getElementById('editMemberProgram');
  const editMemberYear = document.getElementById('editMemberYear');
  const editMemberStatus = document.getElementById('editMemberStatus');
  const editMemberParticipation = document.getElementById('editMemberParticipation');
  const editMemberPoints = document.getElementById('editMemberPoints');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.querySelector('.sidebar');

  let members = [];
  let filteredMembers = [];
  let currentPage = 1;
  const itemsPerPage = 20;
  let selectedMemberId = null;
  let memberToEdit = null;

  function deriveStatus(member) {
    if (member.status === 'suspended') return 'Suspended';
    const participationVal = parseFloat(member.participation ?? '0');
    return participationVal > 50 ? 'Active' : 'Inactive';
  }

  function getProgramAbbreviation(program) {
    const abbrev = {
      'BS Computer Science': 'BSCS',
      'BS Information Technology': 'BSIT',
      'BS Information Systems': 'BSIS'
    };
    return abbrev[program] || program;
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

  function applyFilters() {
    const searchTerm = memberSearch ? memberSearch.value.trim().toLowerCase() : '';
    const programFilter = filterProgram ? filterProgram.value : 'all';
    const statusFilter = filterStatus ? filterStatus.value : 'all';
    const yearFilter = filterYear ? filterYear.value : 'all';

    filteredMembers = members.filter(m => m && m.name && m.studentNumber);

    if (searchTerm) {
      filteredMembers = filteredMembers.filter(m =>
        (m.name && m.name.toLowerCase().includes(searchTerm)) ||
        (m.studentNumber && m.studentNumber.toLowerCase().includes(searchTerm)) ||
        (m.email && m.email.toLowerCase().includes(searchTerm)) ||
        (m.program && m.program.toLowerCase().includes(searchTerm))
      );
    }

    if (programFilter !== 'all') {
      filteredMembers = filteredMembers.filter(m => m.program === programFilter);
    }

    if (statusFilter !== 'all') {
      filteredMembers = filteredMembers.filter(m => deriveStatus(m) === statusFilter);
    }

    if (yearFilter !== 'all') {
      filteredMembers = filteredMembers.filter(m => {
        const year = getYearFromStudentNumber(m.studentNumber);
        const yearNum = { '1st': '1', '2nd': '2', '3rd': '3', '4th': '4' }[year] || '';
        return yearNum === yearFilter;
      });
    }

    currentPage = 1;
    renderMembers();
  }

  function renderMembers() {
    if (!memberTableBody) return;

    if (!filteredMembers.length) {
      memberTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding:16px;">
            <span class="helper-text">No members found.</span>
          </td>
        </tr>
      `;
      if (pageInfo) pageInfo.textContent = 'Page 0';
      if (prevPage) prevPage.disabled = true;
      if (nextPage) nextPage.disabled = true;
      return;
    }

    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const displayMembers = filteredMembers.slice(startIdx, endIdx);

    memberTableBody.innerHTML = displayMembers.map(member => {
      const statusVal = deriveStatus(member);
      const statusClass = `status-pill ${statusVal === 'Active' ? 'active' : statusVal === 'Suspended' ? 'pending' : 'inactive'}`;
      const year = member.year || getYearFromStudentNumber(member.studentNumber);
      return `
        <tr data-id="${member.id}">
          <td>${member.name}</td>
          <td>${member.studentNumber}</td>
          <td>${member.email || '—'}</td>
          <td>${getProgramAbbreviation(member.program)}</td>
          <td>${year}</td>
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

    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevPage) prevPage.disabled = currentPage === 1;
    if (nextPage) nextPage.disabled = currentPage === totalPages;
  }

  function showMemberModal(memberId) {
    const member = members.find(m => m.id == memberId);
    if (!member) return;

    selectedMemberId = memberId;
    const statusVal = deriveStatus(member);
    const year = getYearFromStudentNumber(member.studentNumber);
    const totalPoints = member.points ?? 0;

    memberDetails.innerHTML = `
      <div style="line-height: 1.8;">
        <p><strong>Name:</strong> ${member.name || 'N/A'}</p>
        <p><strong>Student Number:</strong> ${member.studentNumber || 'N/A'}</p>
        <p><strong>Email:</strong> ${member.email || 'N/A'}</p>
        <p><strong>Program:</strong> ${member.program || 'N/A'}</p>
        <p><strong>Year:</strong> ${year}</p>
        <p><strong>Status:</strong> <span class="role-badge ${statusVal === 'Active' ? 'active' : statusVal === 'Suspended' ? 'pending' : 'inactive'}">${statusVal}</span></p>
        <p><strong>Participation:</strong> ${member.participation ?? '—'}%</p>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
          <p><strong>Total Points:</strong> ${totalPoints}</p>
          <p style="color: #9e2a2b; font-weight: 600; margin-top: 4px;">Points earned from sessions and admin awards</p>
        </div>
      </div>
    `;

    viewMemberModal.classList.add('open');
  }

  function closeMember() {
    viewMemberModal.classList.remove('open');
    selectedMemberId = null;
  }

  function showEditMemberModal(memberId) {
    const member = members.find(m => m.id == memberId);
    if (!member) return;
    memberToEdit = member;
    if (editMemberName) editMemberName.value = member.name || '';
    if (editMemberEmail) editMemberEmail.value = member.email || '';
    if (editMemberStudentNumber) editMemberStudentNumber.value = member.studentNumber || '';
    if (editMemberProgram) editMemberProgram.value = member.program || '';
    if (editMemberYear) editMemberYear.value = getYearFromStudentNumber(member.studentNumber);
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
    const year = editMemberYear?.value.trim() || '';
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
          year,
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
      await loadMembers();
      applyFilters();
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
          year: member.year || '',
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
      await loadMembers();
      applyFilters();
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
      await loadMembers();
      applyFilters();
    } catch (err) {
      console.error('Delete member error:', err);
      alert('Could not reach server. Please try again.');
    }
  }

  // Event Listeners
  if (memberSearch) {
    memberSearch.addEventListener('input', applyFilters);
  }

  if (filterProgram) {
    filterProgram.addEventListener('change', applyFilters);
  }

  if (filterStatus) {
    filterStatus.addEventListener('change', applyFilters);
  }

  if (filterYear) {
    filterYear.addEventListener('change', applyFilters);
  }

  if (clearFilters) {
    clearFilters.addEventListener('click', () => {
      if (memberSearch) memberSearch.value = '';
      if (filterProgram) filterProgram.value = 'all';
      if (filterStatus) filterStatus.value = 'all';
      if (filterYear) filterYear.value = 'all';
      applyFilters();
    });
  }

  if (prevPage) {
    prevPage.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderMembers();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  if (nextPage) {
    nextPage.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderMembers();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const csv = [
        ['Name', 'Student Number', 'Email', 'Program', 'Year', 'Status', 'Participation (%)', 'Points'].join(','),
        ...filteredMembers.map(m => [
          m.name,
          m.studentNumber,
          m.email || '',
          m.program,
          getYearFromStudentNumber(m.studentNumber),
          deriveStatus(m),
          m.participation ?? 0,
          m.points ?? 0
        ].map(v => `"${v}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codex-members-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (memberTableBody) {
    memberTableBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const memberId = btn.dataset.id;
      if (action === 'view-member') {
        showMemberModal(memberId);
      } else if (action === 'edit-member') {
        showEditMemberModal(memberId);
      } else if (action === 'toggle-status') {
        await handleToggleStatus(memberId);
      } else if (action === 'delete-member') {
        await handleDeleteMember(memberId);
      }
    });
  }

  if (closeViewMemberModal) {
    closeViewMemberModal.addEventListener('click', closeMember);
  }

  if (closeViewMemberBtn) {
    closeViewMemberBtn.addEventListener('click', closeMember);
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

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      if (sidebar) {
        sidebar.classList.toggle('active');
      }
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === memberModal) {
      closeMember();
    }
    if (e.target === editMemberModal) {
      closeEditMemberModalFunc();
    }
  });

  // Initial load
  await loadMembers();
  applyFilters();
});
