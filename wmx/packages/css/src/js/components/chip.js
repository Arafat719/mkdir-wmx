import { registerComponent } from '../core/component-base.js';

registerComponent({
  selector: '[data-wmx-dismiss="chip"]',
  init(btn) {
    btn.addEventListener('click', () => {
      btn.closest('.wmx-chip')?.remove();
    });
  },
});
