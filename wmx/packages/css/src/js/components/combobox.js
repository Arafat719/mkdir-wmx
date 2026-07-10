import { registerComponent, emit } from '../core/component-base.js';
import { positionFloating } from '../core/floating.js';

registerComponent({
  selector: '[data-wmx-combobox]',
  init(root) {
    const input = root.querySelector('.wmx-input');
    const menu = root.querySelector('.wmx-combobox-menu');
    if (!input || !menu) return;

    if (!menu.id) menu.id = `wmx-combobox-menu-${Math.random().toString(36).slice(2, 8)}`;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', menu.id);
    input.setAttribute('autocomplete', 'off');
    menu.setAttribute('role', 'listbox');

    const allOptions = Array.from(menu.querySelectorAll('.wmx-combobox-option'));
    allOptions.forEach((option, index) => {
      if (!option.id) option.id = `${menu.id}-option-${index}`;
      option.setAttribute('role', 'option');
    });

    let activeIndex = -1;

    const visibleOptions = () => allOptions.filter((option) => !option.hidden);
    const isOpen = () => menu.classList.contains('wmx-open');

    function highlight(index) {
      const visible = visibleOptions();
      allOptions.forEach((option) => option.classList.remove('wmx-active'));
      activeIndex = index;
      const active = visible[index];
      if (active) {
        active.classList.add('wmx-active');
        active.scrollIntoView({ block: 'nearest' });
        input.setAttribute('aria-activedescendant', active.id);
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    }

    function filter() {
      const query = input.value.trim().toLowerCase();
      let matches = 0;
      allOptions.forEach((option) => {
        const isMatch = !query || option.textContent.toLowerCase().includes(query);
        option.hidden = !isMatch;
        if (isMatch) matches++;
      });

      let empty = menu.querySelector('.wmx-combobox-empty');
      if (matches === 0) {
        if (!empty) {
          empty = document.createElement('li');
          empty.className = 'wmx-combobox-empty';
          empty.textContent = 'No results';
          menu.appendChild(empty);
        }
      } else {
        empty?.remove();
      }
      highlight(-1);
      if (isOpen()) positionFloating(input, menu, 'bottom');
    }

    function open() {
      if (isOpen()) return;
      menu.classList.add('wmx-open');
      input.setAttribute('aria-expanded', 'true');
      positionFloating(input, menu, 'bottom');
    }

    function close() {
      menu.classList.remove('wmx-open');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      allOptions.forEach((option) => option.classList.remove('wmx-active'));
      activeIndex = -1;
    }

    function select(option) {
      input.value = option.textContent.trim();
      close();
      emit(root, 'combobox:change', {
        value: option.getAttribute('data-value') ?? option.textContent.trim(),
        text: option.textContent.trim(),
      });
    }

    input.addEventListener('input', () => {
      filter();
      open();
    });

    input.addEventListener('focus', () => {
      filter();
      open();
    });

    input.addEventListener('keydown', (event) => {
      const visible = visibleOptions();
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        open();
        highlight(activeIndex + 1 >= visible.length ? 0 : activeIndex + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        open();
        highlight(activeIndex - 1 < 0 ? visible.length - 1 : activeIndex - 1);
      } else if (event.key === 'Enter') {
        if (isOpen() && activeIndex >= 0) {
          event.preventDefault();
          select(visible[activeIndex]);
        }
      } else if (event.key === 'Escape') {
        if (isOpen()) {
          event.preventDefault();
          close();
        }
      }
    });

    menu.addEventListener('mousedown', (event) => event.preventDefault());
    allOptions.forEach((option) => {
      option.addEventListener('click', () => select(option));
    });

    root.addEventListener('focusout', (event) => {
      if (!root.contains(event.relatedTarget)) close();
    });
  },
});
