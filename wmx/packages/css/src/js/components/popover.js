import { registerComponent, emit } from '../core/component-base.js';
import { positionFloating } from '../core/floating.js';

registerComponent({
  selector: '[data-wmx-toggle="popover"]',
  init(trigger) {
    const targetSelector = trigger.getAttribute('data-wmx-target');
    const popover = targetSelector && document.querySelector(targetSelector);
    if (!popover) return;

    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    function close() {
      popover.classList.remove('wmx-open');
      trigger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeydown);
    }

    function open() {
      popover.classList.add('wmx-open');
      trigger.setAttribute('aria-expanded', 'true');
      positionFloating(trigger, popover, trigger.getAttribute('data-wmx-placement') || 'bottom');
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onKeydown);
      emit(trigger, 'popover:open');
    }

    function onDocClick(event) {
      if (!popover.contains(event.target) && !trigger.contains(event.target)) close();
    }

    function onKeydown(event) {
      if (event.key === 'Escape') {
        close();
        trigger.focus();
      }
    }

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      popover.classList.contains('wmx-open') ? close() : open();
    });
  },
});
