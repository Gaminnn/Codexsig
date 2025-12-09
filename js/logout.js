/**
 * Shared logout modal functionality
 * Can be used by both admin and student pages
 */
function initLogoutModal(userType = 'admin') {
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const closeLogoutModal = document.getElementById('closeLogoutModal');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

  if (!logoutBtn || !logoutModal) {
    console.warn('Logout modal elements not found');
    return;
  }

  function openLogoutModal() {
    logoutModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLogoutModalFunc() {
    logoutModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function performLogout() {
    // Call server-side logout and redirect
    fetch(new URL('../logout.php', window.location.href).href, { method: 'POST' })
      .catch(() => {/* ignore */})
      .finally(() => {
        sessionStorage.clear();
        window.location.href = new URL('../loginpage/login.html', window.location.href).href;
      });
  }

  // Event listeners
  logoutBtn.addEventListener('click', openLogoutModal);

  if (closeLogoutModal) {
    closeLogoutModal.addEventListener('click', closeLogoutModalFunc);
  }

  if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener('click', closeLogoutModalFunc);
  }

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', performLogout);
  }

  // Close modal when clicking outside
  logoutModal.addEventListener('click', event => {
    if (event.target === logoutModal) {
      closeLogoutModalFunc();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && logoutModal.classList.contains('open')) {
      closeLogoutModalFunc();
    }
  });
}

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Will be called explicitly by each page
  });
} else {
  // DOM already loaded, will be called explicitly by each page
}

