import { registerComponent, emit } from '../core/component-base.js';

const STORAGE_KEY = 'wmx-sidebar-collapsed';

// Collapses a .wmx-sidebar to icon-only width and remembers the choice
// across reloads.
registerComponent({
  selector: '[data-wmx-toggle="sidebar"]',
  init(trigger) {
    const targetSelector = trigger.getAttribute('data-wmx-target');
    const sidebar = targetSelector ? document.querySelector(targetSelector) : trigger.closest('.wmx-sidebar');
    if (!sidebar) return;

    const collapsed = localStorage.getItem(STORAGE_KEY) === 'true';
    sidebar.classList.toggle('wmx-collapsed', collapsed);
    trigger.setAttribute('aria-expanded', String(!collapsed));

    trigger.addEventListener('click', () => {
      const isCollapsed = sidebar.classList.toggle('wmx-collapsed');
      trigger.setAttribute('aria-expanded', String(!isCollapsed));
      localStorage.setItem(STORAGE_KEY, String(isCollapsed));
      emit(sidebar, 'sidebar:toggle', { collapsed: isCollapsed });
    });
  },
});
