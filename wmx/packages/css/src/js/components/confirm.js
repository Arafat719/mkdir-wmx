import { Dialog } from '../core/dialog.js';

class ConfirmDialog extends Dialog {
  constructor(el) {
    super(el, { name: 'confirm' });
    this._resolved = false;
    this._resolveFn = null;
  }

  settle(result) {
    if (this._resolved) return;
    this._resolved = true;
    this._resolveFn?.(result);
    this.el.remove();
  }

  close() {
    super.close();
    this.settle(false);
  }
}

// Promise-based replacement for window.confirm(), styled like the rest of
// the framework: WMX.confirm({ title, message }).then((confirmed) => ...)
export function confirm({
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'wmx-modal-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    const modal = document.createElement('div');
    modal.className = 'wmx-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const header = document.createElement('div');
    header.className = 'wmx-modal-header';
    const titleEl = document.createElement('span');
    titleEl.className = 'wmx-modal-title';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const body = document.createElement('div');
    body.className = 'wmx-modal-body';
    if (message) {
      const messageEl = document.createElement('p');
      messageEl.textContent = message;
      body.appendChild(messageEl);
    }

    const footer = document.createElement('div');
    footer.className = 'wmx-modal-footer';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'wmx-btn wmx-btn-ghost';
    cancelBtn.textContent = cancelText;
    const confirmBtn = document.createElement('button');
    confirmBtn.className = `wmx-btn ${danger ? 'wmx-btn-danger' : 'wmx-btn-primary'}`;
    confirmBtn.textContent = confirmText;
    footer.append(cancelBtn, confirmBtn);

    modal.append(header, body, footer);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    const dialog = new ConfirmDialog(backdrop);
    dialog._resolveFn = resolve;

    cancelBtn.addEventListener('click', () => dialog.close());
    confirmBtn.addEventListener('click', () => {
      dialog.settle(true);
      dialog.close();
    });

    requestAnimationFrame(() => dialog.open());
  });
}
