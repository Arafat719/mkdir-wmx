let region;

function getRegion() {
  if (!region) {
    region = document.createElement('div');
    region.className = 'wmx-toast-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
  }
  return region;
}

// Programmatic toast API: WMX.toast.show({ title, message, variant, duration })
export function show({ title, message, variant = 'info', duration = 4000 } = {}) {
  const el = document.createElement('div');
  el.className = `wmx-toast wmx-toast-${variant}`;

  const body = document.createElement('div');
  body.className = 'wmx-toast-body';
  if (title) {
    const strong = document.createElement('strong');
    strong.textContent = title;
    body.appendChild(strong);
  }
  if (message) {
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    body.appendChild(messageEl);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'wmx-toast-close';
  closeBtn.setAttribute('aria-label', 'Dismiss');
  closeBtn.textContent = '×';

  el.append(body, closeBtn);
  getRegion().appendChild(el);

  const dismiss = () => {
    el.classList.add('wmx-toast-leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };

  closeBtn.addEventListener('click', dismiss);
  if (duration) setTimeout(dismiss, duration);

  return { dismiss };
}

export const toast = { show };
