import { registerComponent } from '../core/component-base.js';

// Toggles a password input between masked/plain text. No new CSS — pairs
// with the existing .wmx-input-group + .wmx-btn.
registerComponent({
  selector: '[data-wmx-toggle="password"]',
  init(trigger) {
    const targetSelector = trigger.getAttribute('data-wmx-target');
    const input = targetSelector && document.querySelector(targetSelector);
    if (!input) return;

    trigger.setAttribute('aria-pressed', 'false');

    trigger.addEventListener('click', () => {
      const isVisible = input.type === 'text';
      input.type = isVisible ? 'password' : 'text';
      trigger.setAttribute('aria-pressed', String(!isVisible));
      trigger.textContent = isVisible ? 'Show' : 'Hide';
      input.focus();
    });
  },
});
