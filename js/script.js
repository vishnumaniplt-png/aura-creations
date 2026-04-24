/**
 * Aura Creations – script.js
 * Interactive features:
 *   - Sticky nav with scroll-active highlighting
 *   - Hamburger menu toggle (mobile)
 *   - Scroll-triggered fade-in animations
 *   - Gallery lightbox with keyboard / swipe support
 *   - Contact form validation & submission feedback
 *   - Back-to-top button
 *   - Footer year auto-update
 */

'use strict';

/* ═══════════════════════════════════
   Utilities
   ═══════════════════════════════════ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ═══════════════════════════════════
   Sticky header + nav active state
   ═══════════════════════════════════ */
(function initStickyNav() {
  const header   = $('#site-header');
  const navLinks = $$('.nav-link');
  const sections = $$('section[id]');

  function onScroll() {
    /* scrolled class for header background */
    header.classList.toggle('scrolled', window.scrollY > 60);

    /* active section highlight */
    let current = '';
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= 120) current = sec.id;
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();

/* ═══════════════════════════════════
   Hamburger menu toggle
   ═══════════════════════════════════ */
(function initHamburger() {
  const btn      = $('#hamburger');
  const navLinks = $('#nav-links');

  /* Overlay element for dismissing menu on outside click */
  const overlay = document.createElement('div');
  overlay.id = 'nav-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:899;opacity:0;pointer-events:none;transition:opacity 0.35s ease';
  document.body.appendChild(overlay);

  function showOverlay() { overlay.style.opacity = '1'; overlay.style.pointerEvents = 'auto'; }
  function hideOverlay() { overlay.style.opacity = '0'; overlay.style.pointerEvents = 'none'; }

  function openMenu() {
    navLinks.classList.add('open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    showOverlay();
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    navLinks.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    hideOverlay();
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    navLinks.classList.contains('open') ? closeMenu() : openMenu();
  });

  overlay.addEventListener('click', closeMenu);

  $$('.nav-link').forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMenu();
  });
})();

/* ═══════════════════════════════════
   Fade-in on scroll (IntersectionObserver)
   ═══════════════════════════════════ */
(function initFadeIn() {
  const items = $$('.fade-in');

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => observer.observe(el));
})();

/* ═══════════════════════════════════
   Gallery Lightbox
   ═══════════════════════════════════ */
(function initLightbox() {
  const galleryItems  = $$('.gallery-item');
  const lightbox      = $('#lightbox');
  const backdrop      = $('#lightbox-backdrop');
  const img           = $('#lightbox-img');
  const caption       = $('#lightbox-caption');
  const closeBtn      = $('#lightbox-close');
  const prevBtn       = $('#lightbox-prev');
  const nextBtn       = $('#lightbox-next');

  let currentIndex = 0;

  /* Build data array from gallery items */
  const images = galleryItems.map(item => ({
    src     : item.querySelector('img').src,
    alt     : item.querySelector('img').alt,
    caption : item.querySelector('.gallery-overlay p')?.textContent || ''
  }));

  function openLightbox(index) {
    currentIndex = index;
    showImage(currentIndex);
    lightbox.hidden  = false;
    backdrop.hidden  = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.hidden  = true;
    backdrop.hidden  = true;
    document.body.style.overflow = '';
    /* Return focus to the triggering gallery item */
    galleryItems[currentIndex]?.focus();
  }

  function showImage(index) {
    const data = images[index];
    img.src          = data.src;
    img.alt          = data.alt;
    caption.textContent = data.caption;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === images.length - 1;
  }

  function prev() {
    if (currentIndex > 0) { currentIndex--; showImage(currentIndex); }
  }
  function next() {
    if (currentIndex < images.length - 1) { currentIndex++; showImage(currentIndex); }
  }

  /* Click handlers on gallery items */
  galleryItems.forEach((item, i) => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `View ${images[i].caption || 'image'} in lightbox`);
    item.addEventListener('click',   () => openLightbox(i));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  backdrop.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click',  prev);
  nextBtn.addEventListener('click',  next);

  /* Keyboard nav */
  document.addEventListener('keydown', e => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  /* Touch / swipe support */
  let touchStartX = null;
  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    touchStartX = null;
  }, { passive: true });
})();

/* ═══════════════════════════════════
   Contact form validation
   ═══════════════════════════════════ */
(function initContactForm() {
  const form       = $('#contact-form');
  if (!form) return;

  const successMsg = $('#form-success');

  const rules = {
    name    : { required: true, minLen: 2,  label: 'Name' },
    email   : { required: true, isEmail: true, label: 'Email' },
    message : { required: true, minLen: 10, label: 'Message' }
  };

  function validate(field) {
    const rule  = rules[field.name];
    const error = $(`#${field.name}-error`);
    if (!rule || !error) return true;

    const val = field.value.trim();
    if (rule.required && !val) {
      error.textContent = `${rule.label} is required.`;
      field.setAttribute('aria-invalid', 'true');
      return false;
    }
    if (rule.minLen && val.length < rule.minLen) {
      error.textContent = `${rule.label} must be at least ${rule.minLen} characters.`;
      field.setAttribute('aria-invalid', 'true');
      return false;
    }
    if (rule.isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      error.textContent = 'Please enter a valid email address.';
      field.setAttribute('aria-invalid', 'true');
      return false;
    }
    error.textContent = '';
    field.removeAttribute('aria-invalid');
    return true;
  }

  /* Validate on blur */
  Object.keys(rules).forEach(name => {
    const field = form.elements[name];
    if (field) field.addEventListener('blur', () => validate(field));
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const fields  = Object.keys(rules).map(name => form.elements[name]).filter(Boolean);
    const allValid = fields.every(validate);
    if (!allValid) {
      fields.find(f => f.getAttribute('aria-invalid') === 'true')?.focus();
      return;
    }

    /* Simulate submission */
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled    = true;
    btn.textContent = 'Sending…';

    setTimeout(() => {
      form.reset();
      btn.disabled    = false;
      btn.textContent = 'Send Message ✈';
      successMsg.hidden = false;
      successMsg.focus();
      setTimeout(() => { successMsg.hidden = true; }, 6000);
    }, 1200);
  });
})();

/* ═══════════════════════════════════
   Back-to-top button
   ═══════════════════════════════════ */
(function initBackToTop() {
  const btn = $('#back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
    btn.hidden = false; // remove hidden attr once page has scrolled
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ═══════════════════════════════════
   Footer year
   ═══════════════════════════════════ */
(function setFooterYear() {
  const el = $('#footer-year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ═══════════════════════════════════
   Smooth scroll for anchor links
   (fallback for browsers that don't
    support scroll-behavior: smooth)
   ═══════════════════════════════════ */
(function initSmoothScroll() {
  const HEADER_H = 72; // approximate sticky header height
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id  = link.getAttribute('href').slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_H;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
