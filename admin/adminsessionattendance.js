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

  // Get session ID from URL
  const params = new URLSearchParams(window.location.search);
  const sessionId = parseInt(params.get('id'));

  if (!sessionId) {
    alert('Invalid session ID');
    window.location.href = new URL('../admin/adminsession.html', window.location.href).href;
    return;
  }

  const attendanceList = document.getElementById('attendanceList');
  const sessionTitle = document.getElementById('sessionTitle');
  const sessionDetails = document.getElementById('sessionDetails');
  const backToSessionsBtn = document.getElementById('backToSessionsBtn');
  const presentAllBtn = document.getElementById('presentAllBtn');
  const searchMembers = document.getElementById('searchMembers');
  const pointsModal = document.getElementById('pointsModal');
  const closePointsModal = document.getElementById('closePointsModal');
  const cancelPointsBtn = document.getElementById('cancelPointsBtn');
  const submitPointsBtn = document.getElementById('submitPointsBtn');
  const pointsForm = document.getElementById('pointsForm');
  const memberName = document.getElementById('memberName');
  const pointsInput = document.getElementById('pointsInput');
  const memberDetailModal = document.getElementById('memberDetailModal');
  const closeMemberDetailModal = document.getElementById('closeMemberDetailModal');
  const closeMemberDetailBtn = document.getElementById('closeMemberDetailBtn');

  let attendance = [];
  let currentMemberId = null;
  let sessionData = null;

  // Load session details
  async function loadSessionDetails() {
    try {
      const res = await fetch(new URL('../adminphp/getsessions.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && Array.isArray(data.sessions)) {
        sessionData = data.sessions.find(s => parseInt(s.id) === sessionId);
        if (sessionData) {
          sessionTitle.textContent = sessionData.title;
          sessionDetails.textContent = `${sessionData.session_date} | ${sessionData.start_time} - ${sessionData.end_time} | ${sessionData.location}`;
        }
      }
    } catch (e) {
      console.error('Error loading session details', e);
    }
  }

  // Load attendance
  async function loadAttendance() {
    try {
      const res = await fetch(new URL(`../adminphp/getattendance.php?session_id=${sessionId}`, window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && Array.isArray(data.attendance)) {
        attendance = data.attendance;
      } else {
        console.error('Failed to load attendance', res.status, data);
        attendance = [];
      }
    } catch (e) {
      console.error('Error loading attendance', e);
      attendance = [];
    }
    renderAttendance();
  }

  // Render attendance list
  function renderAttendance() {
    if (!attendanceList) return;

    // Get search term
    const searchTerm = searchMembers?.value?.toLowerCase().trim() || '';
    
    // Filter attendance based on search
    let filteredAttendance = attendance;
    if (searchTerm) {
      filteredAttendance = attendance.filter(record =>
        record.member_name.toLowerCase().includes(searchTerm) ||
        record.studentNumber.toLowerCase().includes(searchTerm)
      );
    }

    if (!filteredAttendance.length) {
      attendanceList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <p>${searchTerm ? 'No members match your search.' : 'No members found for this session.'}</p>
        </div>
      `;
      return;
    }

    attendanceList.innerHTML = filteredAttendance.map((record, index) => {
      const isPresent = parseInt(record.is_present) === 1;
      const pointsAwarded = parseInt(record.points_awarded) || 0;

      return `
        <div class="attendance-record${isPresent ? ' present' : ''}" data-record-index="${index}" style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
          <div class="attendance-info">
            <h4 class="member-name">${record.member_name}</h4>
            <div class="attendance-details">
              <span class="detail-item">📍 ${record.program}</span>
              <span class="detail-item">🎓 ${record.studentNumber}</span>
              <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 4px;">
                <span class="detail-item" style="color: #9e2a2b; font-weight: 600;">Bonus Points: ${pointsAwarded}</span>
                <span class="detail-item" style="font-size: 12px; color: #888;">Awarded by admin</span>
              </div>
            </div>
          </div>
          <div class="attendance-status">
            <div class="status-indicator ${isPresent ? 'present' : 'absent'}">
              ${isPresent ? '✅ Present' : '❌ Absent'}
            </div>
            <div class="attendance-actions">
              <button class="btn btn-sm btn-outline toggle-present" data-id="${record.id}" data-present="${isPresent ? 1 : 0}">
                ${isPresent ? 'Mark Absent' : 'Mark Present'}
              </button>
              <button class="btn btn-sm btn-primary add-points" data-id="${record.id}" data-name="${record.member_name}">
                + Points
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Add click listeners to attendance records
    document.querySelectorAll('.attendance-record').forEach((card, index) => {
      card.addEventListener('click', (e) => {
        // Don't open modal if clicking on buttons
        if (!e.target.closest('button')) {
          openMemberDetailModal(filteredAttendance[index]);
        }
      });
    });

    // Add event listeners to toggle buttons
    document.querySelectorAll('.toggle-present').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const isCurrentlyPresent = parseInt(e.target.dataset.present) === 1;
        handleTogglePresent(parseInt(id), !isCurrentlyPresent);
      });
    });

    // Add event listeners to points buttons
    document.querySelectorAll('.add-points').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const name = e.target.dataset.name;
        openPointsModal(parseInt(id), name);
      });
    });
  }

  // Toggle present status
  async function handleTogglePresent(attendanceId, isPresent) {
    try {
      const res = await fetch(new URL('../adminphp/updateattendance.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          id: attendanceId,
          is_present: isPresent ? 1 : 0
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const msg = data?.message || 'Failed to update attendance.';
        alert(msg);
        return;
      }
      await loadAttendance();
    } catch (err) {
      console.error('Update attendance error:', err);
      alert('Could not reach server. Please try again.');
    }
  }

  // Mark all members as present
  async function handlePresentAll() {
    const absentCount = attendance.filter(r => parseInt(r.is_present) === 0).length;
    if (absentCount === 0) {
      alert('All members are already marked as present!');
      return;
    }

    const confirmed = confirm(`Mark ${absentCount} member(s) as present?`);
    if (!confirmed) return;

    try {
      // Get all absent members and mark them as present
      const absentMembers = attendance.filter(r => parseInt(r.is_present) === 0);
      let successCount = 0;
      let failureCount = 0;

      for (const member of absentMembers) {
        try {
          const res = await fetch(new URL('../adminphp/updateattendance.php', window.location.href).href, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              id: member.id,
              is_present: 1
            })
          });
          const data = await res.json().catch(() => null);
          if (res.ok && data?.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (err) {
          failureCount++;
        }
      }

      // Reload attendance
      await loadAttendance();
      
      // Show summary
      if (failureCount === 0) {
        alert(`Successfully marked ${successCount} member(s) as present!`);
      } else {
        alert(`Marked ${successCount} member(s) as present.\nFailed to update ${failureCount} member(s).`);
      }
    } catch (err) {
      console.error('Present all error:', err);
      alert('Could not reach server. Please try again.');
    }
  }

  // Open points modal
  function openPointsModal(memberId, name) {
    currentMemberId = memberId;
    memberName.value = name;
    pointsInput.value = '';
    pointsModal.classList.add('open');
  }

  // Close points modal
  function closeModal() {
    pointsModal.classList.remove('open');
    currentMemberId = null;
    pointsInput.value = '';
  }

  // Submit points
  async function handleSubmitPoints() {
    const points = parseInt(pointsInput?.value || 0);

    if (!currentMemberId || points < 0 || points > 100) {
      alert('Please enter a valid number of points (0-100).');
      return;
    }

    try {
      const res = await fetch(new URL('../adminphp/awardpoints.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          id: currentMemberId,
          points: points
        })
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const msg = data?.message || 'Failed to award points.';
        alert(msg);
        return;
      }

      closeModal();
      await loadAttendance();
      alert('Points awarded successfully!');
    } catch (err) {
      console.error('Award points error:', err);
      alert('Could not reach server. Please try again.');
    }
  }

  // Event listeners
  if (backToSessionsBtn) backToSessionsBtn.addEventListener('click', () => {
    window.location.href = new URL('../admin/adminsession.html', window.location.href).href;
  });

  if (presentAllBtn) presentAllBtn.addEventListener('click', handlePresentAll);

  if (closePointsModal) closePointsModal.addEventListener('click', closeModal);
  if (cancelPointsBtn) cancelPointsBtn.addEventListener('click', closeModal);
  if (submitPointsBtn) submitPointsBtn.addEventListener('click', handleSubmitPoints);

  // Search members
  if (searchMembers) {
    searchMembers.addEventListener('input', () => {
      renderAttendance();
    });
  }

  // Quick points buttons
  document.querySelectorAll('.quick-points').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const pointsToAdd = parseInt(btn.getAttribute('data-points'));
      const currentValue = parseInt(pointsInput.value) || 0;
      pointsInput.value = currentValue + pointsToAdd;
      pointsInput.focus();
    });
  });

  // Close modal when clicking outside
  if (pointsModal) {
    pointsModal.addEventListener('click', (e) => {
      if (e.target === pointsModal) closeModal();
    });
  }

  // Initial load
  await loadSessionDetails();
  await loadAttendance();
});
