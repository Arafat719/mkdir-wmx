import { registerComponent, emit } from '../core/component-base.js';

registerComponent({
  selector: '.wmx-accordion-trigger',
  init(trigger) {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;

    const collapsed = trigger.getAttribute('aria-expanded') !== 'true';
    panel.classList.toggle('wmx-open', !collapsed);
    panel.toggleAttribute('inert', collapsed);

    trigger.addEventListener('click', () => {
      const expand = trigger.getAttribute('aria-expanded') !== 'true';
      trigger.setAttribute('aria-expanded', String(expand));
      panel.classList.toggle('wmx-open', expand);
      panel.toggleAttribute('inert', !expand);
      emit(trigger, 'accordion:toggle', { expanded: expand });
    });
  },
});
