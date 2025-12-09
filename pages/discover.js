document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const currentPath = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const target = href.split('/').pop();
    if (target === currentPath) {
      link.classList.add('active');
    }
  });
});

