import { registerComponent, emit } from '../core/component-base.js';

registerComponent({
  selector: '[data-wmx-rating]',
  init(root) {
    const stars = Array.from(root.querySelectorAll('.wmx-rating-input-star'));
    if (!stars.length) return;

    root.setAttribute('role', 'radiogroup');
    stars.forEach((star) => star.setAttribute('role', 'radio'));

    let value = stars.findIndex((star) => star.getAttribute('aria-checked') === 'true') + 1;
    if (value <= 0) value = Number(root.getAttribute('data-wmx-value')) || 0;

    function paint(previewValue) {
      stars.forEach((star, index) => {
        star.classList.toggle('wmx-rating-input-star-filled', index < previewValue);
      });
    }

    function setValue(newValue, { commit = true } = {}) {
      value = newValue;
      paint(value);
      const tabbableIndex = Math.max(0, value - 1);
      stars.forEach((star, index) => {
        star.setAttribute('aria-checked', String(index === value - 1));
        star.setAttribute('tabindex', index === tabbableIndex ? '0' : '-1');
      });
      if (commit) emit(root, 'rating:change', { value });
    }

    stars.forEach((star, index) => {
      star.addEventListener('click', () => setValue(index + 1));
      star.addEventListener('mouseenter', () => paint(index + 1));
      star.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
          event.preventDefault();
          const next = Math.min(stars.length, (value || 0) + 1);
          setValue(next);
          stars[next - 1].focus();
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
          event.preventDefault();
          const next = Math.max(1, (value || 1) - 1);
          setValue(next);
          stars[next - 1].focus();
        } else if (event.key === 'Home') {
          event.preventDefault();
          setValue(1);
          stars[0].focus();
        } else if (event.key === 'End') {
          event.preventDefault();
          setValue(stars.length);
          stars[stars.length - 1].focus();
        }
      });
    });

    root.addEventListener('mouseleave', () => paint(value));

    setValue(value, { commit: false });
  },
});
