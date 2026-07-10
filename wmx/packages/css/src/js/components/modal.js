import { registerComponent } from '../core/component-base.js';
import { Dialog, getOrCreateDialog } from '../core/dialog.js';

export class Modal extends Dialog {
  constructor(el) {
    super(el, { name: 'modal' });
  }
}

registerComponent({
  selector: '[data-wmx-toggle="modal"]',
  init(trigger) {
    trigger.addEventListener('click', () => {
      const targetSelector = trigger.getAttribute('data-wmx-target');
      const target = targetSelector && document.querySelector(targetSelector);
      if (target) getOrCreateDialog(target, Modal).open();
    });
  },
});

export function getModal(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  return el ? getOrCreateDialog(el, Modal) : null;
}
