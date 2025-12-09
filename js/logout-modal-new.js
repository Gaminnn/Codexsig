// Global Logout Modal Handler

function initLogoutModalNew(userRole = 'student') {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

    if (!logoutBtn || !logoutModal) return;

    // Open logout modal
    logoutBtn.addEventListener('click', () => {
        logoutModal.classList.add('show');
    });

    // Close logout modal
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            logoutModal.classList.remove('show');
        });
    }

    // Close modal when clicking overlay
    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            logoutModal.classList.remove('show');
        }
    });

    // Handle logout confirmation
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', async () => {
            try {
                await fetch('./logout.php', {
                    method: 'POST',
                    credentials: 'same-origin'
                });
                window.location.href = '../loginpage/login.html';
            } catch (err) {
                console.error('Logout error:', err);
                window.location.href = '../loginpage/login.html';
            }
        });
    }
}
