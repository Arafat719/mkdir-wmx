import { emit } from './component-base.js';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Shared open/close + focus-trap behavior for backdrop-based overlays
// (Modal, Drawer). The backdrop element toggles `.wmx-open`; the first
// element child is treated as the dialog surface that receives focus trap.
export class Dialog {
  constructor(backdropEl, { name = 'dialog' } = {}) {
    this.el = backdropEl;
    this.name = name;
    this.dialog = backdropEl.querySelector('[role="dialog"]') || backdropEl.firstElementChild;
    this._lastFocused = null;
    this._onKeydown = this._onKeydown.bind(this);

    backdropEl.addEventListener('click', (event) => {
      if (event.target === backdropEl) this.close();
    });
    backdropEl.querySelectorAll('[data-wmx-dismiss]').forEach((btn) => {
      btn.addEventListener('click', () => this.close());
    });
  }

  open() {
    this._lastFocused = document.activeElement;
    this.el.classList.add('wmx-open');
    this.el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', this._onKeydown);
    const target = this.dialog?.querySelector(FOCUSABLE) || this.dialog;
    target?.focus();
    emit(this.el, `${this.name}:open`);
  }

  close() {
    this.el.classList.remove('wmx-open');
    this.el.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this._onKeydown);
    this._lastFocused?.focus();
    emit(this.el, `${this.name}:close`);
  }

  _onKeydown(event) {
    if (event.key === 'Escape') {
      this.close();
      return;
    }
    if (event.key !== 'Tab' || !this.dialog) return;

    const focusables = Array.from(this.dialog.querySelectorAll(FOCUSABLE)).filter(
      (node) => node.offsetParent !== null
    );
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

const instances = new WeakMap();

export function getOrCreateDialog(el, DialogClass, options) {
  if (!instances.has(el)) instances.set(el, new DialogClass(el, options));
  return instances.get(el);
}
