// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Show the real logo image once a file actually exists at assets/img/logo.png;
// otherwise the SVG placeholder badge (already visible by default) stays put.
const logoImg = document.getElementById('logo-img');
if (logoImg) {
  logoImg.addEventListener('load', () => {
    logoImg.classList.add('loaded');
  });
  logoImg.addEventListener('error', () => {
    logoImg.remove();
  });
}

// Mobile nav toggle — full-screen overlay
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

function closeMobileNav() {
  navLinks.classList.remove('open');
  navToggle.classList.remove('active');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('active', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);
  });
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });
}

