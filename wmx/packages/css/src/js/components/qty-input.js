import { registerComponent, emit } from '../core/component-base.js';

registerComponent({
  selector: '[data-wmx-qty]',
  init(root) {
    const input = root.querySelector('.wmx-qty-input');
    const buttons = Array.from(root.querySelectorAll('[data-wmx-qty-step]'));
    if (!input || !buttons.length) return;

    const min = input.min !== '' ? Number(input.min) : -Infinity;
    const max = input.max !== '' ? Number(input.max) : Infinity;

    function syncDisabled() {
      const value = Number(input.value) || 0;
      buttons.forEach((button) => {
        const step = Number(button.getAttribute('data-wmx-qty-step')) || 1;
        button.disabled = step < 0 ? value <= min : value >= max;
      });
    }

    function setValue(value) {
      input.value = String(Math.min(max, Math.max(min, value)));
      syncDisabled();
      emit(root, 'qty:change', { value: Number(input.value) });
    }

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const step = Number(button.getAttribute('data-wmx-qty-step')) || 1;
        setValue((Number(input.value) || 0) + step);
      });
    });

    input.addEventListener('change', () => setValue(Number(input.value) || 0));

    syncDisabled();
  },
});
