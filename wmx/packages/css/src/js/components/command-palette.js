import { registerComponent, emit } from '../core/component-base.js';
import { Dialog, getOrCreateDialog } from '../core/dialog.js';

export class CommandPalette extends Dialog {
  constructor(el) {
    super(el, { name: 'command-palette' });

    this.input = this.dialog?.querySelector('.wmx-command-palette-input');
    this.list = this.dialog?.querySelector('.wmx-command-palette-list');
    this.items = this.list ? Array.from(this.list.querySelectorAll('.wmx-command-palette-item')) : [];
    this.activeIndex = -1;

    if (this.list && !this.list.id) this.list.id = `${el.id || 'wmx-command-palette'}-list`;
    if (this.input) {
      this.input.setAttribute('role', 'combobox');
      this.input.setAttribute('aria-autocomplete', 'list');
      if (this.list) this.input.setAttribute('aria-controls', this.list.id);
    }
    this.list?.setAttribute('role', 'listbox');

    this.items.forEach((item, index) => {
      if (!item.id) item.id = `${this.list.id}-item-${index}`;
      item.setAttribute('role', 'option');
      item.addEventListener('click', () => this.select(item));
    });

    this.input?.addEventListener('input', () => this.filter());
    this.input?.addEventListener('keydown', (event) => this._onNavKeydown(event));
  }

  visibleItems() {
    return this.items.filter((item) => !item.hidden);
  }

  highlight(index) {
    const visible = this.visibleItems();
    this.items.forEach((item) => item.classList.remove('wmx-active'));
    this.activeIndex = index;
    const active = visible[index];
    if (active) {
      active.classList.add('wmx-active');
      active.scrollIntoView({ block: 'nearest' });
      this.input?.setAttribute('aria-activedescendant', active.id);
    } else {
      this.input?.removeAttribute('aria-activedescendant');
    }
  }

  filter() {
    const query = (this.input?.value || '').trim().toLowerCase();
    let matches = 0;
    this.items.forEach((item) => {
      const isMatch = !query || item.textContent.toLowerCase().includes(query);
      item.hidden = !isMatch;
      if (isMatch) matches++;
    });

    let empty = this.list?.querySelector('.wmx-command-palette-empty');
    if (matches === 0) {
      if (!empty && this.list) {
        empty = document.createElement('li');
        empty.className = 'wmx-command-palette-empty';
        empty.textContent = 'No matching commands';
        this.list.appendChild(empty);
      }
    } else {
      empty?.remove();
    }
    this.highlight(matches ? 0 : -1);
  }

  select(item) {
    emit(this.el, 'command-palette:select', {
      value: item.getAttribute('data-value') ?? item.textContent.trim(),
      text: item.textContent.trim(),
    });
    this.close();
  }

  _onNavKeydown(event) {
    const visible = this.visibleItems();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlight(this.activeIndex + 1 >= visible.length ? 0 : this.activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlight(this.activeIndex - 1 < 0 ? visible.length - 1 : this.activeIndex - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const active = visible[this.activeIndex];
      if (active) this.select(active);
    }
  }

  open() {
    super.open();
    if (this.input) this.input.value = '';
    this.items.forEach((item) => {
      item.hidden = false;
    });
    this.list?.querySelector('.wmx-command-palette-empty')?.remove();
    this.highlight(this.items.length ? 0 : -1);
  }
}

registerComponent({
  selector: '[data-wmx-command-palette]',
  init(el) {
    getOrCreateDialog(el, CommandPalette);
  },
});

registerComponent({
  selector: '[data-wmx-toggle="command-palette"]',
  init(trigger) {
    trigger.addEventListener('click', () => {
      const targetSelector = trigger.getAttribute('data-wmx-target');
      const target = targetSelector && document.querySelector(targetSelector);
      if (target) getOrCreateDialog(target, CommandPalette).open();
    });
  },
});

export function getCommandPalette(target) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  return el ? getOrCreateDialog(el, CommandPalette) : null;
}

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
    const el = document.querySelector('[data-wmx-command-palette]');
    if (!el) return;
    event.preventDefault();
    const palette = getOrCreateDialog(el, CommandPalette);
    if (el.classList.contains('wmx-open')) {
      palette.close();
    } else {
      palette.open();
    }
  });
}
