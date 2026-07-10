import { registerComponent, emit } from '../core/component-base.js';

function compareValues(a, b) {
  const numA = Number(a);
  const numB = Number(b);
  if (a !== '' && b !== '' && !Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// Click-to-sort column headers. Add data-wmx-sort to any <th>; sorting is
// purely a DOM reorder of <tbody> rows, so it works with whatever markup is
// already in the cells (badges, links, ...).
registerComponent({
  selector: '[data-wmx-table]',
  init(table) {
    const headers = Array.from(table.querySelectorAll('thead th[data-wmx-sort]'));
    const tbody = table.querySelector('tbody');
    if (!headers.length || !tbody) return;

    headers.forEach((th) => {
      th.setAttribute('role', 'button');
      th.setAttribute('tabindex', '0');
      th.setAttribute('aria-sort', 'none');
    });

    function sortBy(th) {
      const index = Array.from(th.parentElement.children).indexOf(th);
      const direction = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
      headers.forEach((header) => header.setAttribute('aria-sort', 'none'));
      th.setAttribute('aria-sort', direction);

      const rows = Array.from(tbody.querySelectorAll(':scope > tr')).filter(
        (row) => !row.classList.contains('wmx-table-empty')
      );
      rows.sort((rowA, rowB) => {
        const a = rowA.children[index]?.textContent.trim() ?? '';
        const b = rowB.children[index]?.textContent.trim() ?? '';
        const result = compareValues(a, b);
        return direction === 'ascending' ? result : -result;
      });
      rows.forEach((row) => tbody.appendChild(row));
      emit(table, 'table:sort', { column: index, direction });
    }

    headers.forEach((th) => {
      th.addEventListener('click', () => sortBy(th));
      th.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          sortBy(th);
        }
      });
    });
  },
});

// Filters a table's rows by a search input elsewhere on the page:
// <input data-wmx-table-filter="#my-table">. Matches against a row's full
// text content.
registerComponent({
  selector: '[data-wmx-table-filter]',
  init(input) {
    const targetSelector = input.getAttribute('data-wmx-table-filter');
    const table = targetSelector && document.querySelector(targetSelector);
    const tbody = table?.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll(':scope > tr'));
    const columnCount = table.querySelector('thead tr')?.children.length || 1;

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      let visibleCount = 0;
      rows.forEach((row) => {
        const matches = !query || row.textContent.toLowerCase().includes(query);
        row.hidden = !matches;
        if (matches) visibleCount++;
      });

      let empty = tbody.querySelector('.wmx-table-empty');
      if (visibleCount === 0) {
        if (!empty) {
          empty = document.createElement('tr');
          empty.className = 'wmx-table-empty';
          const cell = document.createElement('td');
          cell.colSpan = columnCount;
          cell.textContent = 'No matching rows';
          empty.appendChild(cell);
          tbody.appendChild(empty);
        }
      } else {
        empty?.remove();
      }

      emit(table, 'table:filter', { query, visibleCount });
    });
  },
});
