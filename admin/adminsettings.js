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

  // Elements
  const editAccountBtn = document.getElementById('editAccountBtn');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const editAccountModal = document.getElementById('editAccountModal');
  const closeEditAccountModal = document.getElementById('closeEditAccountModal');
  const cancelEditAccountBtn = document.getElementById('cancelEditAccountBtn');
  const submitEditAccountBtn = document.getElementById('submitEditAccountBtn');
  const changePasswordModal = document.getElementById('changePasswordModal');
  const closeChangePasswordModal = document.getElementById('closeChangePasswordModal');
  const cancelChangePasswordBtn = document.getElementById('cancelChangePasswordBtn');
  const submitChangePasswordBtn = document.getElementById('submitChangePasswordBtn');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');

  // Load and display current admin info from session
  let currentAdmin = null;
  async function loadAdminInfo() {
    try {
      const res = await fetch(new URL('../session_user.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data.user && ['admin', 'superadmin'].includes(data.role)) {
        currentAdmin = data.user;
        const nameEl = document.getElementById('currentAdminName');
        const emailEl = document.getElementById('currentAdminEmail');
        const userEl = document.getElementById('currentAdminUsername');
        if (nameEl) nameEl.textContent = currentAdmin.name || '—';
        if (emailEl) emailEl.textContent = currentAdmin.email || '—';
        if (userEl) userEl.textContent = currentAdmin.username || '—';
      }
    } catch (_) {}
  }

  // Edit account modal handlers
  if (editAccountBtn) {
    editAccountBtn.addEventListener('click', async () => {
      if (!currentAdmin) {
        await loadAdminInfo();
      }
      if (editAccountModal) {
        document.getElementById('editAccountName').value = currentAdmin?.name || '';
        document.getElementById('editAccountEmail').value = currentAdmin?.email || '';
        document.getElementById('editAccountUsername').value = currentAdmin?.username || '';
        editAccountModal.classList.add('open');
      }
    });
  }

  function closeEditAccountModalFunc() {
    if (editAccountModal) {
      editAccountModal.classList.remove('open');
    }
  }

  if (closeEditAccountModal) {
    closeEditAccountModal.addEventListener('click', closeEditAccountModalFunc);
  }

  if (cancelEditAccountBtn) {
    cancelEditAccountBtn.addEventListener('click', closeEditAccountModalFunc);
  }

  if (submitEditAccountBtn) {
    submitEditAccountBtn.addEventListener('click', async () => {
      const name = document.getElementById('editAccountName').value.trim();
      const email = document.getElementById('editAccountEmail').value.trim();
      const username = document.getElementById('editAccountUsername').value.trim();

      if (!name || !email || !username) {
        alert('Please fill in all fields.');
        return;
      }

      try {
        const res = await fetch(new URL('../adminphp/update_admin.php', window.location.href).href, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ name, email, username })
        });
        const raw = await res.text();
        let data = null;
        try { data = JSON.parse(raw); } catch (_) {}
        if (!res.ok || !data?.success) {
          const msg = data?.message || raw || 'Update failed.';
          alert(msg);
          return;
        }
        alert('Account updated successfully!');
        closeEditAccountModalFunc();
        await loadAdminInfo();
        // Reflect immediately on the settings page
        const nameEl = document.getElementById('currentAdminName');
        const emailEl = document.getElementById('currentAdminEmail');
        const userEl = document.getElementById('currentAdminUsername');
        if (nameEl) nameEl.textContent = name;
        if (emailEl) emailEl.textContent = email;
        if (userEl) userEl.textContent = username;
      } catch (err) {
        console.error('Update admin error:', err);
        alert('Could not reach server. Please try again.');
      }
    });
  }

  // Change password modal handlers
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      if (changePasswordModal) {
        changePasswordModal.classList.add('open');
        document.getElementById('changePasswordForm').reset();
      }
    });
  }

  function closeChangePasswordModalFunc() {
    if (changePasswordModal) {
      changePasswordModal.classList.remove('open');
    }
  }

  if (closeChangePasswordModal) {
    closeChangePasswordModal.addEventListener('click', closeChangePasswordModalFunc);
  }

  if (cancelChangePasswordBtn) {
    cancelChangePasswordBtn.addEventListener('click', closeChangePasswordModalFunc);
  }

  if (submitChangePasswordBtn) {
    submitChangePasswordBtn.addEventListener('click', async () => {
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmNewPassword = document.getElementById('confirmNewPassword').value;

      if (newPassword !== confirmNewPassword) {
        alert('New passwords do not match.');
        return;
      }
      if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }

      try {
        const res = await fetch(new URL('../adminphp/change_admin_password.php', window.location.href).href, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ currentPassword, newPassword, confirmPassword: confirmNewPassword })
        });
        const raw = await res.text();
        let data = null;
        try { data = JSON.parse(raw); } catch (_) {}
        if (!res.ok || !data?.success) {
          const msg = data?.message || raw || 'Password change failed.';
          alert(msg);
          return;
        }
        alert('Password changed successfully!');
        closeChangePasswordModalFunc();
      } catch (err) {
        console.error('Change password error:', err);
        alert('Could not reach server. Please try again.');
      }
    });
  }

  // Mobile menu toggle
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
      }
    });
  }

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === editAccountModal) {
      closeEditAccountModalFunc();
    }
    if (e.target === changePasswordModal) {
      closeChangePasswordModalFunc();
    }
  });

  // Initial load
  await loadAdminInfo();
  if (!currentAdmin) {
    alert('Could not load admin info from the database. Please relogin and try again.');
  }
});
