import { registerComponent } from '../core/component-base.js';
import { positionFloating } from '../core/floating.js';

let tooltipEl;
let uid = 0;
let activeTrigger;

function getTooltipEl() {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'wmx-tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    tooltipEl.id = `wmx-tooltip-${++uid}`;
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

registerComponent({
  selector: '[data-wmx-tooltip]',
  init(trigger) {
    let hideTimer;

    function show() {
      clearTimeout(hideTimer);
      activeTrigger = trigger;
      const tip = getTooltipEl();
      tip.textContent = trigger.getAttribute('data-wmx-tooltip');
      trigger.setAttribute('aria-describedby', tip.id);
      tip.classList.add('wmx-open');
      positionFloating(trigger, tip, trigger.getAttribute('data-wmx-tooltip-placement') || 'top');
    }

    function hide() {
      hideTimer = setTimeout(() => {
        // A different trigger may have taken over the shared tooltip element
        // since this hide() was scheduled (e.g. mouse moved directly from
        // this trigger to another one) — don't hide its tooltip out from
        // under it.
        if (activeTrigger !== trigger) return;
        tooltipEl?.classList.remove('wmx-open');
        trigger.removeAttribute('aria-describedby');
      }, 60);
    }

    trigger.addEventListener('mouseenter', show);
    trigger.addEventListener('focus', show);
    trigger.addEventListener('mouseleave', hide);
    trigger.addEventListener('blur', hide);
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') hide();
    });
  },
});
