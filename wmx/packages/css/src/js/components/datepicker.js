import { registerComponent, emit } from '../core/component-base.js';
import { positionFloating } from '../core/floating.js';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toDisplay(date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function sameDay(a, b) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseISO(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

registerComponent({
  selector: '[data-wmx-datepicker]',
  init(root) {
    const input = root.querySelector('.wmx-input');
    if (!input) return;

    const today = new Date();
    let selected = parseISO(root.getAttribute('data-wmx-value')) || parseISO(input.value);
    let viewDate = new Date(selected || today);
    viewDate.setDate(1);
    let cursorDate = new Date(selected || today);

    if (selected && !input.value) input.value = toDisplay(selected);

    const panel = document.createElement('div');
    panel.className = 'wmx-datepicker-panel';
    panel.id = `wmx-datepicker-panel-${Math.random().toString(36).slice(2, 8)}`;
    panel.innerHTML = `
      <div class="wmx-datepicker-header">
        <button type="button" class="wmx-btn wmx-btn-ghost wmx-btn-sm" data-nav="prev" aria-label="Previous month">‹</button>
        <span class="wmx-datepicker-title"></span>
        <button type="button" class="wmx-btn wmx-btn-ghost wmx-btn-sm" data-nav="next" aria-label="Next month">›</button>
      </div>
      <div class="wmx-datepicker-weekdays">${WEEKDAYS.map((day) => `<span>${day}</span>`).join('')}</div>
      <div class="wmx-datepicker-days" role="grid"></div>
    `;
    root.appendChild(panel);

    const title = panel.querySelector('.wmx-datepicker-title');
    const daysEl = panel.querySelector('.wmx-datepicker-days');

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-haspopup', 'true');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', panel.id);

    const isOpen = () => panel.classList.contains('wmx-open');

    function render() {
      title.textContent = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const gridStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      gridStart.setDate(gridStart.getDate() - gridStart.getDay());

      const cells = [];
      for (let i = 0; i < 42; i++) {
        cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
      }

      daysEl.innerHTML = cells.map((cellDate) => {
        const classes = ['wmx-datepicker-day'];
        if (cellDate.getMonth() !== viewDate.getMonth()) classes.push('wmx-datepicker-day-muted');
        if (sameDay(cellDate, today)) classes.push('wmx-datepicker-day-today');
        const isSelected = sameDay(cellDate, selected);
        if (isSelected) classes.push('wmx-active');
        const isCursor = sameDay(cellDate, cursorDate);
        return `<button type="button" class="${classes.join(' ')}" data-date="${toISO(cellDate)}" tabindex="${isCursor ? '0' : '-1'}" aria-selected="${isSelected}">${cellDate.getDate()}</button>`;
      }).join('');

      daysEl.querySelector(`[data-date="${toISO(cursorDate)}"]`)?.focus();
    }

    function open() {
      if (isOpen()) return;
      cursorDate = new Date(selected || today);
      viewDate = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
      panel.classList.add('wmx-open');
      input.setAttribute('aria-expanded', 'true');
      render();
      positionFloating(input, panel, 'bottom');
    }

    function close(focusInput) {
      panel.classList.remove('wmx-open');
      input.setAttribute('aria-expanded', 'false');
      if (focusInput) input.focus();
    }

    function select(iso) {
      selected = parseISO(iso);
      input.value = toDisplay(selected);
      close(true);
      emit(root, 'datepicker:change', { value: iso, date: new Date(selected) });
    }

    function navigate(deltaMonths) {
      viewDate.setMonth(viewDate.getMonth() + deltaMonths);
      const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
      cursorDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), Math.min(cursorDate.getDate(), lastDay));
      render();
      positionFloating(input, panel, 'bottom');
    }

    input.addEventListener('click', open);
    input.addEventListener('keydown', (event) => {
      if ((event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') && !isOpen()) {
        event.preventDefault();
        open();
      }
    });

    panel.querySelector('[data-nav="prev"]').addEventListener('click', () => navigate(-1));
    panel.querySelector('[data-nav="next"]').addEventListener('click', () => navigate(1));

    daysEl.addEventListener('click', (event) => {
      const button = event.target.closest('.wmx-datepicker-day');
      if (button) select(button.getAttribute('data-date'));
    });

    daysEl.addEventListener('keydown', (event) => {
      const deltas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      if (event.key in deltas) {
        event.preventDefault();
        cursorDate = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), cursorDate.getDate() + deltas[event.key]);
        if (cursorDate.getMonth() !== viewDate.getMonth() || cursorDate.getFullYear() !== viewDate.getFullYear()) {
          viewDate = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
        }
        render();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select(toISO(cursorDate));
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      } else if (event.key === 'PageUp') {
        event.preventDefault();
        navigate(-1);
      } else if (event.key === 'PageDown') {
        event.preventDefault();
        navigate(1);
      }
    });

    root.addEventListener('focusout', (event) => {
      if (!root.contains(event.relatedTarget)) close(false);
    });
  },
});
