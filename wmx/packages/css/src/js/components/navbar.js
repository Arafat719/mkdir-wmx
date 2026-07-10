import { registerComponent, emit } from '../core/component-base.js';

// Toggles the collapsible nav menu on narrow viewports. Closes automatically
// on outside click or Escape, and when a nav link inside it is clicked.
registerComponent({
  selector: '[data-wmx-toggle="navbar"]',
  init(trigger) {
    const targetSelector = trigger.getAttribute('data-wmx-target');
    const menu = targetSelector
      ? document.querySelector(targetSelector)
      : trigger.closest('.wmx-navbar')?.querySelector('.wmx-navbar-nav');
    if (!menu) return;

    trigger.setAttribute('aria-expanded', 'false');

    function close() {
      menu.classList.remove('wmx-open');
      trigger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeydown);
    }

    function open() {
      menu.classList.add('wmx-open');
      trigger.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onKeydown);
      emit(trigger, 'navbar:open');
    }

    function onDocClick(event) {
      if (!menu.contains(event.target) && event.target !== trigger) close();
    }

    function onKeydown(event) {
      if (event.key === 'Escape') close();
    }

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      menu.classList.contains('wmx-open') ? close() : open();
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', close);
    });
  },
});

// Auto-hide: slides a `.wmx-navbar-sticky` bar out of view on scroll-down,
// back in on scroll-up. Stays visible until scrolled past its own height so
// it doesn't flicker right at the top of the page.
registerComponent({
  selector: '.wmx-navbar-sticky',
  init(navbar) {
    let lastY = window.scrollY;
    let ticking = false;

    function onScroll() {
      const y = window.scrollY;
      const scrollingDown = y > lastY;
      navbar.classList.toggle('wmx-navbar-hidden', scrollingDown && y > navbar.offsetHeight);
      lastY = y;
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(onScroll);
      },
      { passive: true }
    );
  },
});

// Scrollspy: marks whichever in-page section is currently in view as
// `.wmx-active` on its matching `.wmx-navbar-link`. Only applies to
// same-page hash links — cross-page links (e.g. href="guide.html") are
// left as-is.
registerComponent({
  selector: '.wmx-navbar-nav',
  init(nav) {
    const sections = Array.from(nav.querySelectorAll('.wmx-navbar-link[href^="#"]'))
      .map((link) => ({ link, target: document.querySelector(link.getAttribute('href')) }))
      .filter((entry) => entry.target);
    if (!sections.length) return;

    const isIntersecting = new Map(sections.map((entry) => [entry.target, false]));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => isIntersecting.set(entry.target, entry.isIntersecting));
        const active = sections.find((entry) => isIntersecting.get(entry.target));
        if (!active) return;
        sections.forEach(({ link }) => link.classList.remove('wmx-active'));
        active.link.classList.add('wmx-active');
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );

    sections.forEach(({ target }) => observer.observe(target));
  },
});
