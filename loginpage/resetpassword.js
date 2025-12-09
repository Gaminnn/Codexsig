document.addEventListener('DOMContentLoaded', function() {
    const yr = document.getElementById('year');
    if (yr) yr.textContent = new Date().getFullYear();

    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');

    // Check if user has a valid reset token
    const resetToken = sessionStorage.getItem('resetToken');
    const resetUserId = sessionStorage.getItem('resetUserId');

    if (!resetToken || !resetUserId) {
        errorMessage.textContent = 'Invalid or expired reset link. Please try again.';
        errorMessage.style.display = 'block';
        if (resetPasswordForm) resetPasswordForm.style.display = 'none';
        return;
    }

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Validation
            if (!newPassword || !confirmPassword) {
                errorMessage.textContent = 'Please fill in all password fields.';
                errorMessage.style.display = 'block';
                return;
            }

            if (newPassword.length < 6) {
                errorMessage.textContent = 'Password must be at least 6 characters long.';
                errorMessage.style.display = 'block';
                return;
            }

            if (newPassword !== confirmPassword) {
                errorMessage.textContent = 'Passwords do not match.';
                errorMessage.style.display = 'block';
                return;
            }

            errorMessage.style.display = 'none';

            try {
                const res = await fetch(new URL('../loginphp/resetpassword.php', window.location.href).href, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        userId: resetUserId,
                        token: resetToken,
                        newPassword: newPassword
                    })
                });

                const raw = await res.text();
                let data = null;
                try { data = JSON.parse(raw); } catch (_) { /* ignore */ }

                if (!res.ok || !data?.success) {
                    const msg = data?.message || raw || 'Failed to reset password. Please try again.';
                    errorMessage.textContent = msg;
                    errorMessage.style.display = 'block';
                    return;
                }

                // Success
                successMessage.style.display = 'block';
                resetPasswordForm.style.display = 'none';
                
                // Clear session storage
                sessionStorage.removeItem('resetToken');
                sessionStorage.removeItem('resetUserId');

                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } catch (err) {
                console.error('Reset password error:', err);
                errorMessage.textContent = 'Could not reach server. Please try again.';
                errorMessage.style.display = 'block';
            }
        });
    }
});
