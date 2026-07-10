import { registerComponent } from '../core/component-base.js';
import { Dialog, getOrCreateDialog } from '../core/dialog.js';

export class Drawer extends Dialog {
  constructor(el) {
    super(el, { name: 'drawer' });
  }
}

registerComponent({
  selector: '[data-wmx-toggle="drawer"]',
  init(trigger) {
    trigger.addEventListener('click', () => {
      const targetSelector = trigger.getAttribute('data-wmx-target');
      const target = targetSelector && document.querySelector(targetSelector);
      if (target) getOrCreateDialog(target, Drawer).open();
    });
  },
});

export function getDrawer(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  return el ? getOrCreateDialog(el, Drawer) : null;
}
