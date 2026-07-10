import { registerComponent, emit } from '../core/component-base.js';

// Native HTML5 drag-and-drop reordering for a list's direct children. Add
// data-wmx-sortable to the container — child draggable="true" is set for you.
registerComponent({
  selector: '[data-wmx-sortable]',
  init(root) {
    let draggedItem = null;

    function items() {
      return Array.from(root.children);
    }

    items().forEach((item) => item.setAttribute('draggable', 'true'));

    function itemFromEvent(event) {
      let node = event.target;
      while (node && node.parentElement !== root) node = node.parentElement;
      return node;
    }

    function clearIndicators() {
      items().forEach((item) => item.classList.remove('wmx-drag-over-top', 'wmx-drag-over-bottom'));
    }

    function emitReorder() {
      emit(root, 'sortable:reorder', {
        order: items().map((item) => item.getAttribute('data-value') ?? item.textContent.trim()),
      });
    }

    root.addEventListener('dragstart', (event) => {
      const item = itemFromEvent(event);
      if (!item) return;
      draggedItem = item;
      item.classList.add('wmx-dragging');
      event.dataTransfer.effectAllowed = 'move';
    });

    root.addEventListener('dragend', () => {
      draggedItem?.classList.remove('wmx-dragging');
      draggedItem = null;
      clearIndicators();
    });

    root.addEventListener('dragover', (event) => {
      const item = itemFromEvent(event);
      if (!item || item === draggedItem) return;
      event.preventDefault();
      const rect = item.getBoundingClientRect();
      const isAfter = event.clientY - rect.top > rect.height / 2;
      clearIndicators();
      item.classList.add(isAfter ? 'wmx-drag-over-bottom' : 'wmx-drag-over-top');
    });

    root.addEventListener('drop', (event) => {
      const item = itemFromEvent(event);
      if (!item || item === draggedItem || !draggedItem) return;
      event.preventDefault();
      const rect = item.getBoundingClientRect();
      const isAfter = event.clientY - rect.top > rect.height / 2;
      root.insertBefore(draggedItem, isAfter ? item.nextSibling : item);
      clearIndicators();
      emitReorder();
    });
  },
});
