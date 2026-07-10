import { registerComponent, emit } from '../core/component-base.js';

registerComponent({
  selector: '[data-wmx-carousel]',
  init(root) {
    const track = root.querySelector('.wmx-carousel-track');
    const slides = track ? Array.from(track.children) : [];
    if (!track || slides.length < 2) return;

    const prevBtn = root.querySelector('.wmx-carousel-prev');
    const nextBtn = root.querySelector('.wmx-carousel-next');

    let dotsContainer = root.querySelector('.wmx-carousel-dots');
    if (!dotsContainer) {
      dotsContainer = document.createElement('div');
      dotsContainer.className = 'wmx-carousel-dots';
      root.appendChild(dotsContainer);
    }
    const dots = slides.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'wmx-carousel-dot';
      dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
      dot.addEventListener('click', () => {
        goTo(index);
        startAuto();
      });
      dotsContainer.appendChild(dot);
      return dot;
    });

    slides.forEach((slide, index) => {
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${index + 1} of ${slides.length}`);
    });

    root.setAttribute('aria-roledescription', 'carousel');
    track.setAttribute('tabindex', '0');

    const intervalMs = Number(root.getAttribute('data-wmx-autoplay')) || 0;
    let current = 0;
    let timer = null;

    function render() {
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((dot, index) => {
        dot.classList.toggle('wmx-active', index === current);
        dot.setAttribute('aria-current', String(index === current));
      });
      emit(root, 'carousel:change', { index: current });
    }

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      render();
    }

    function next() {
      goTo(current + 1);
    }

    function prev() {
      goTo(current - 1);
    }

    function startAuto() {
      stopAuto();
      if (intervalMs) timer = setInterval(next, intervalMs);
    }

    function stopAuto() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    prevBtn?.addEventListener('click', () => {
      prev();
      startAuto();
    });
    nextBtn?.addEventListener('click', () => {
      next();
      startAuto();
    });

    root.addEventListener('mouseenter', stopAuto);
    root.addEventListener('mouseleave', startAuto);
    root.addEventListener('focusin', stopAuto);
    root.addEventListener('focusout', (event) => {
      if (!root.contains(event.relatedTarget)) startAuto();
    });

    track.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prev();
        startAuto();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        next();
        startAuto();
      }
    });

    let startX = null;
    track.addEventListener(
      'touchstart',
      (event) => {
        startX = event.touches[0].clientX;
      },
      { passive: true }
    );
    track.addEventListener('touchend', (event) => {
      if (startX === null) return;
      const deltaX = event.changedTouches[0].clientX - startX;
      if (Math.abs(deltaX) > 40) {
        if (deltaX < 0) next();
        else prev();
        startAuto();
      }
      startX = null;
    });

    render();
    startAuto();
  },
});
