document.addEventListener('DOMContentLoaded', async () => {
  // Session auth check (server-side)
  try {
    const res = await fetch(new URL('../session_user.php', window.location.href).href, { credentials: 'same-origin' });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success || data.role !== 'student') {
      window.location.href = '../loginpage/login.html';
      return;
    }
  } catch (e) {
    window.location.href = '../loginpage/login.html';
    return;
  }

  // Elements
  const logoutBtn = document.getElementById('logoutBtn');
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

  // Load and display current student info
  let currentStudent = null;
  async function loadStudentInfo() {
    try {
      const res = await fetch(new URL('../studentphp/getmemberdata.php', window.location.href).href, { credentials: 'same-origin' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data.member) {
        currentStudent = data.member;
        const nameEl = document.getElementById('currentName');
        const emailEl = document.getElementById('currentEmail');
        const studentNoEl = document.getElementById('currentStudentNumber');
        if (nameEl) nameEl.textContent = currentStudent.name || '—';
        if (emailEl) emailEl.textContent = currentStudent.email || '—';
        if (studentNoEl) studentNoEl.textContent = currentStudent.studentNumber || '—';
      }
    } catch (_) {}
  }

  // Edit account modal handlers
  if (editAccountBtn) {
    editAccountBtn.addEventListener('click', async () => {
      if (!currentStudent) {
        await loadStudentInfo();
      }
      if (editAccountModal) {
        document.getElementById('editName').value = currentStudent?.name || '';
        document.getElementById('editEmail').value = currentStudent?.email || '';
        document.getElementById('editStudentNumber').value = currentStudent?.studentNumber || '';
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
      const name = document.getElementById('editName').value.trim();
      const email = document.getElementById('editEmail').value.trim();
      const studentNumber = document.getElementById('editStudentNumber').value.trim();

      if (!name || !email || !studentNumber) {
        alert('Please fill in all required fields.');
        return;
      }

      try {
        const res = await fetch(new URL('../studentphp/updatestudent.php', window.location.href).href, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ name, email, studentNumber })
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
        await loadStudentInfo();
        // Reflect immediately on the settings page
        const nameEl = document.getElementById('currentName');
        const emailEl = document.getElementById('currentEmail');
        const studentNoEl = document.getElementById('currentStudentNumber');
        if (nameEl) nameEl.textContent = name;
        if (emailEl) emailEl.textContent = email;
        if (studentNoEl) studentNoEl.textContent = studentNumber;
      } catch (err) {
        console.error('Update student error:', err);
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
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (newPassword !== confirmPassword) {
        alert('New passwords do not match.');
        return;
      }
      if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }

      try {
        const res = await fetch(new URL('../studentphp/changestudentpassword.php', window.location.href).href, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ currentPassword, newPassword, confirmPassword })
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

  // Sidebar navigation - highlight current page
  const currentPage = window.location.pathname.split('/').pop() || 'studentsettings.html';
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage || (currentPage === '' && linkPage === 'studentsettings.html')) {
      link.classList.add('active');
    }
  });

  // Mobile menu toggle
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
  await loadStudentInfo();
  if (!currentStudent) {
    console.log('Could not load student info from the database.');
  }
});
