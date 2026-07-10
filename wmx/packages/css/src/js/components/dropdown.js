import { registerComponent } from '../core/component-base.js';

registerComponent({
  selector: '[data-wmx-toggle="dropdown"]',
  init(trigger) {
    const dropdown = trigger.closest('.wmx-dropdown');
    const menu = dropdown?.querySelector('.wmx-dropdown-menu');
    if (!menu) return;

    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');

    const items = () => Array.from(menu.querySelectorAll('.wmx-dropdown-item'));

    function onDocClick(event) {
      if (!dropdown.contains(event.target)) close();
    }

    function onKeydown(event) {
      const list = items();
      const currentIndex = list.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        close(true);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        (list[currentIndex + 1] || list[0])?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        (list[currentIndex - 1] || list[list.length - 1])?.focus();
      }
    }

    function open() {
      menu.classList.add('wmx-open');
      trigger.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onKeydown);
    }

    function close(focusTrigger = false) {
      menu.classList.remove('wmx-open');
      trigger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeydown);
      if (focusTrigger) trigger.focus();
    }

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = menu.classList.contains('wmx-open');
      if (isOpen) {
        close();
      } else {
        open();
        items()[0]?.focus();
      }
    });
  },
});
