import { registerComponent } from '../core/component-base.js';

registerComponent({
  selector: '[data-wmx-dismiss="alert"]',
  init(btn) {
    btn.addEventListener('click', () => {
      btn.closest('.wmx-alert')?.remove();
    });
  },
});
