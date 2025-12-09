document.addEventListener('DOMContentLoaded', async () => {
  // Session auth check (server-side)
  try {
    const res = await fetch(new URL('../session_user.php', window.location.href).href, { credentials: 'same-origin' });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success || !['admin', 'superadmin'].includes(data.role)) {
      window.location.href = '../loginpage/login.html';
      return;
    }
  } catch (e) {
    window.location.href = '../loginpage/login.html';
    return;
  }

  const pendingTableBody = document.getElementById('pendingTableBody');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const pendingSearch = document.getElementById('pendingSearch');

  let pending = [];

  async function loadPending() {
    try {
      const res = await fetch(new URL('../adminphp/getpending.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && Array.isArray(data.pending)) {
        pending = data.pending;
      } else {
        pending = [];
      }
    } catch (e) {
      pending = [];
    }
    renderPending();
  }

  function renderPending(list = null) {
    const data = list || pending;
    if (!pendingTableBody) return;
    if (!data || data.length === 0) {
      pendingTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">
            <p>No pending registrations</p>
          </td>
        </tr>
      `;
      return;
    }
    pendingTableBody.innerHTML = data.map(p => `
      <tr>
        <td>${escapeHtml(p.name || 'N/A')}</td>
        <td>${escapeHtml(p.studentNumber || 'N/A')}</td>
        <td>${escapeHtml(p.email || 'N/A')}</td>
        <td>${escapeHtml(p.program || 'N/A')}</td>
        <td>
          <div class="admin-actions">
            <button class="btn btn-outline btn-sm" onclick="handleApprovePending('${p.id}')">Approve</button>
            <button class="btn-danger-sm" onclick="handleRejectPending('${p.id}')">Reject</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.handleApprovePending = async function(pendingId) {
    try {
      const res = await fetch(new URL('../adminphp/approvepending.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id: pendingId })
      });
      const raw = await res.text();
      let data = null;
      try { data = JSON.parse(raw); } catch (_) {}
      if (!res.ok || !data?.success) {
        const msg = data?.message || raw || 'Failed to approve.';
        alert(msg);
        return;
      }
      alert('Member approved.');
      await loadPending();
    } catch (err) {
      console.error('Approve pending error:', err);
      alert('Could not reach server. Please try again.');
    }
  };

  window.handleRejectPending = async function(pendingId) {
    try {
      const res = await fetch(new URL('../adminphp/rejectpending.php', window.location.href).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id: pendingId })
      });
      const raw = await res.text();
      let data = null;
      try { data = JSON.parse(raw); } catch (_) {}
      if (!res.ok || !data?.success) {
        const msg = data?.message || raw || 'Failed to reject.';
        alert(msg);
        return;
      }
      alert('Pending registration rejected.');
      await loadPending();
    } catch (err) {
      console.error('Reject pending error:', err);
      alert('Could not reach server. Please try again.');
    }
  };

  // Mobile menu toggle
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
      }
    });
  }



  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function applyPendingFilters() {
    const term = pendingSearch ? pendingSearch.value.toLowerCase().trim() : '';
    let list = pending;
    if (term) {
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.studentNumber && p.studentNumber.toLowerCase().includes(term)) ||
        (p.email && p.email.toLowerCase().includes(term)) ||
        (p.program && p.program.toLowerCase().includes(term))
      );
    }
    renderPending(list);
  }

  if (pendingSearch) {
    pendingSearch.addEventListener('input', applyPendingFilters);
  }

  // Initial load
  loadPending();
});
