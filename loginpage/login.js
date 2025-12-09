function togglePasswordClick(e) {
    const btn = e.currentTarget;
    const wrapper = btn.closest('.password-toggle');
    if (!wrapper) return;
    const input = wrapper.querySelector('input');
    if (!input) return;

    const eye = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    const eyeOff = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.77 20.77 0 0 1 5.06-6.94"></path><path d="M1 1l22 22"></path><path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88"></path><path d="M14.12 14.12 9.88 9.88"></path></svg>';

    if (input.type === 'password') {
        input.type = 'text';
        btn.setAttribute('aria-label', 'Hide password');
        btn.innerHTML = eyeOff;
    } else {
        input.type = 'password';
        btn.setAttribute('aria-label', 'Show password');
        btn.innerHTML = eye;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Resolve targets relative to this page (handles spaces/paths reliably)
    const superadminUrl = new URL('../superadmin/superadmindashboard.html', window.location.href).href;
    const adminUrl = new URL('../admin/admindashboard.html', window.location.href).href;
    const studentUrl = new URL('../student/studentdashboard.html', window.location.href).href;
    const resetPasswordUrl = new URL('../loginpage/resetpassword.html', window.location.href).href;

    const yr = document.getElementById('year');
    if (yr) yr.textContent = new Date().getFullYear();
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const registerContainer = document.getElementById('registerContainer');
    const loginContainer = document.querySelector('.login-container');
    
    // Forgot Password Modal Elements
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeForgotModal = document.getElementById('closeForgotModal');
    const cancelForgotBtn = document.getElementById('cancelForgotBtn');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    // Open forgot password modal
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            forgotPasswordModal.style.display = 'flex';
        });
    }
    
    // Close forgot password modal
    function closeForgotPasswordModal() {
        forgotPasswordModal.style.display = 'none';
        if (forgotPasswordForm) forgotPasswordForm.reset();
    }
    
    if (closeForgotModal) {
        closeForgotModal.addEventListener('click', closeForgotPasswordModal);
    }
    
    if (cancelForgotBtn) {
        cancelForgotBtn.addEventListener('click', closeForgotPasswordModal);
    }
    
    // Close modal when clicking outside
    if (forgotPasswordModal) {
        forgotPasswordModal.addEventListener('click', function(e) {
            if (e.target === forgotPasswordModal) {
                closeForgotPasswordModal();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && forgotPasswordModal.style.display === 'flex') {
                closeForgotPasswordModal();
            }
        });
    }
    
    // Handle forgot password form submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('forgotEmail').value.trim();
            const studentNumber = document.getElementById('forgotStudentNo').value.trim();
            
            if (!email || !studentNumber) {
                alert('Please enter both email and student number.');
                return;
            }
            
            try {
                const res = await fetch(new URL('../loginphp/verifyforgetpassword.php', window.location.href).href, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ email, studentNumber })
                });
                
                const raw = await res.text();
                let data = null;
                try { data = JSON.parse(raw); } catch (_) { /* ignore */ }
                
                if (!res.ok || !data?.success) {
                    const msg = data?.message || raw || 'User not found. Please check your information.';
                    alert(msg);
                    return;
                }
                
                // Show success message
                alert(data.message);
                closeForgotPasswordModal();
                if (forgotPasswordForm) forgotPasswordForm.reset();
            } catch (err) {
                console.error('Forgot password error:', err);
                alert('Could not reach server. Please try again.');
            }
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            
            // Basic validation
            if (!username || !password) {
                alert('Please enter both username and password.');
                return;
            }
            // Authenticate against backend
            try {
                const res = await fetch(new URL('../loginconnection.php', window.location.href).href, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ username, password })
                });

                // Always read text first so we can show server errors
                const raw = await res.text();
                let data = null;
                try { data = JSON.parse(raw); } catch (_) { /* ignore */ }

                if (!res.ok) {
                    const msg = data?.message || raw || 'Login failed. Please try again.';
                    alert(msg);
                    return;
                }

                if (!data || data.success !== true) {
                    const msg = data?.message || 'Invalid credentials.';
                    alert(msg);
                    return;
                }

                // Basic role routing
                if (data.role === 'admin' || data.role === 'superadmin') {
                    window.location.href = data.role === 'superadmin'
                        ? superadminUrl
                        : adminUrl;
                    return;
                }

                // Student route
                if (data.role === 'student') {
                    window.location.href = studentUrl;
                    return;
                }

                alert('Unhandled role. Please contact admin.');
            } catch (err) {
                console.error('Login request error:', err);
                alert('Could not reach server. Please try again.');
            }
        });
    }

    if (showRegister && registerContainer && loginContainer) {
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'block';
            window.scrollTo({ top: 0 });
        });
    }

    if (showLogin && registerContainer && loginContainer) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            registerContainer.style.display = 'none';
            loginContainer.style.display = 'block';
            window.scrollTo({ top: 0 });
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                return;
            }

            const formData = new FormData(registerForm);

            try {
                const res = await fetch(new URL('../registerconnection.php', window.location.href).href, {
                    method: 'POST',
                    body: formData
                });
                const raw = await res.text();
                let data = null;
                try { data = JSON.parse(raw); } catch (_) { /* ignore */ }

                if (!res.ok || data?.success === false) {
                    const msg = data?.message || raw || 'Server error while registering. Please try again.';
                    console.error('Registration failed response:', raw);
                    alert(msg);
                    return;
                }

                if (data?.success || (raw && raw.toLowerCase().includes('successful'))) {
                    alert('Registration successful! You can now login.');
                    if (showLogin && registerContainer && loginContainer) {
                        registerContainer.style.display = 'none';
                        loginContainer.style.display = 'block';
                        window.scrollTo({ top: 0 });
                    }
                } else {
                    alert('Registration response did not indicate success. Please try again.');
                }
            } catch (err) {
                console.error('Registration request error:', err);
                alert('Could not reach server. Please try again.');
            }
        });
    }
});

