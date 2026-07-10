import { registerComponent, emit } from '../core/component-base.js';

registerComponent({
  selector: '[data-wmx-otp]',
  init(root) {
    const digits = Array.from(root.querySelectorAll('.wmx-otp-digit'));
    if (!digits.length) return;

    function emitChange() {
      const value = digits.map((digit) => digit.value).join('');
      emit(root, 'otp:change', { value, complete: digits.every((digit) => digit.value !== '') });
    }

    digits.forEach((digit, index) => {
      digit.addEventListener('input', () => {
        digit.value = digit.value.slice(-1);
        if (digit.value && digits[index + 1]) digits[index + 1].focus();
        emitChange();
      });

      digit.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && !digit.value) {
          const prev = digits[index - 1];
          if (prev) {
            event.preventDefault();
            prev.value = '';
            prev.focus();
            emitChange();
          }
        } else if (event.key === 'ArrowLeft' && digits[index - 1]) {
          event.preventDefault();
          digits[index - 1].focus();
        } else if (event.key === 'ArrowRight' && digits[index + 1]) {
          event.preventDefault();
          digits[index + 1].focus();
        }
      });

      digit.addEventListener('paste', (event) => {
        event.preventDefault();
        const text = (event.clipboardData || window.clipboardData).getData('text').trim();
        if (!text) return;
        digits.forEach((target, i) => {
          target.value = text[i] || '';
        });
        const nextEmpty = digits.find((target) => !target.value);
        (nextEmpty || digits[digits.length - 1]).focus();
        emitChange();
      });
    });
  },
});
