// Positions a fixed-position floating element (tooltip/popover) relative to
// a trigger. Tries the requested placement, then falls back to whichever
// side actually fits the viewport.
export function positionFloating(trigger, el, placement = 'top', gap = 8) {
  const triggerRect = trigger.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  const positions = {
    top: {
      top: triggerRect.top - elRect.height - gap,
      left: triggerRect.left + triggerRect.width / 2 - elRect.width / 2,
    },
    bottom: {
      top: triggerRect.bottom + gap,
      left: triggerRect.left + triggerRect.width / 2 - elRect.width / 2,
    },
    left: {
      top: triggerRect.top + triggerRect.height / 2 - elRect.height / 2,
      left: triggerRect.left - elRect.width - gap,
    },
    right: {
      top: triggerRect.top + triggerRect.height / 2 - elRect.height / 2,
      left: triggerRect.right + gap,
    },
  };

  const fits = (pos) =>
    pos.top >= 0 &&
    pos.left >= 0 &&
    pos.left + elRect.width <= window.innerWidth &&
    pos.top + elRect.height <= window.innerHeight;

  const order = [placement, 'top', 'bottom', 'right', 'left'];
  const chosen = positions[order.find((candidate) => fits(positions[candidate])) ?? placement] || positions.top;

  el.style.top = `${Math.max(4, chosen.top)}px`;
  el.style.left = `${Math.max(4, chosen.left)}px`;
}
