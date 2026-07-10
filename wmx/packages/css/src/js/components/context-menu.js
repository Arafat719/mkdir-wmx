import { registerComponent, emit } from '../core/component-base.js';

registerComponent({
  selector: '[data-wmx-contextmenu]',
  init(trigger) {
    const targetSelector = trigger.getAttribute('data-wmx-contextmenu');
    const menu = targetSelector && document.querySelector(targetSelector);
    if (!menu) return;

    menu.classList.add('wmx-context-menu');

    function close() {
      menu.classList.remove('wmx-open');
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeydown);
    }

    function onDocClick(event) {
      if (!menu.contains(event.target)) close();
    }

    function onKeydown(event) {
      if (event.key === 'Escape') close();
    }

    trigger.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      menu.style.left = `${event.clientX}px`;
      menu.style.top = `${event.clientY}px`;
      menu.classList.add('wmx-open');

      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) menu.style.left = `${Math.max(8, window.innerWidth - rect.width - 8)}px`;
      if (rect.bottom > window.innerHeight) menu.style.top = `${Math.max(8, window.innerHeight - rect.height - 8)}px`;

      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onKeydown);
      emit(trigger, 'contextmenu:open', {});
    });

    menu.querySelectorAll('.wmx-dropdown-item').forEach((item) => {
      item.addEventListener('click', close);
    });
  },
});
