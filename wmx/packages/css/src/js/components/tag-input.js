import { registerComponent, emit } from '../core/component-base.js';

registerComponent({
  selector: '[data-wmx-tag-input]',
  init(root) {
    const field = root.querySelector('.wmx-tag-input-field');
    if (!field) return;

    let hidden = root.querySelector('.wmx-tag-input-hidden');
    if (!hidden) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.className = 'wmx-tag-input-hidden';
      root.appendChild(hidden);
    }
    const name = root.getAttribute('data-wmx-name');
    if (name) hidden.name = name;

    const tags = [];

    function sync() {
      hidden.value = tags.map((tag) => tag.value).join(',');
      emit(root, 'taginput:change', { tags: tags.map((tag) => tag.value) });
    }

    function removeTag(tag) {
      const index = tags.indexOf(tag);
      if (index === -1) return;
      tags.splice(index, 1);
      tag.el.remove();
      sync();
    }

    function addTag(rawValue) {
      const value = rawValue.trim();
      if (!value || tags.some((tag) => tag.value.toLowerCase() === value.toLowerCase())) return;

      const el = document.createElement('span');
      el.className = 'wmx-chip wmx-chip-primary';

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'wmx-chip-remove';
      remove.setAttribute('aria-label', `Remove ${value}`);
      remove.textContent = '×';

      el.append(value, remove);
      root.insertBefore(el, field);

      const tag = { value, el };
      remove.addEventListener('click', () => removeTag(tag));
      tags.push(tag);
      sync();
    }

    (root.getAttribute('data-wmx-value') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach(addTag);

    field.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        addTag(field.value);
        field.value = '';
      } else if (event.key === 'Backspace' && field.value === '' && tags.length > 0) {
        removeTag(tags[tags.length - 1]);
      } else if (event.key === 'Escape' && field.value) {
        field.value = '';
      }
    });

    field.addEventListener('blur', () => {
      if (field.value.trim()) {
        addTag(field.value);
        field.value = '';
      }
    });

    root.addEventListener('click', (event) => {
      if (event.target === root) field.focus();
    });
  },
});
