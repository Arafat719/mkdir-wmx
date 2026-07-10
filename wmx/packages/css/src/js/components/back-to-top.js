import { registerComponent } from '../core/component-base.js';

registerComponent({
  selector: '.wmx-back-to-top',
  init(btn) {
    const threshold = Number(btn.getAttribute('data-wmx-threshold')) || 400;

    const onScroll = () => {
      btn.classList.toggle('wmx-visible', window.scrollY > threshold);
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  },
});
