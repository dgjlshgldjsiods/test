import { createElement } from './dom.js';

export class DataTable {
  constructor(container, options) {
    this.container = container;
    this.columns = options.columns || [];
    this.i18n = options.i18n;
    this.onSort = options.onSort || (() => {});
  }

  render(items, sort = []) {
    const wrapper = createElement('div', { className: 'table-responsive' });
    const table = createElement('table', { className: 'table table-hover align-middle mb-0' });
    const head = createElement('thead');
    const headRow = createElement('tr');
    const activeSort = sort[0] || {};

    this.columns.forEach((column) => {
      const cell = createElement('th', { attributes: { scope: 'col' } });
      if (column.sortable) {
        const direction = activeSort.field === column.key ? activeSort.direction : null;
        const button = createElement('button', {
          className: 'btn btn-link link-body-emphasis text-decoration-none p-0 fw-semibold',
          text: column.label + sortIndicator(direction),
          attributes: { type: 'button' }
        });
        button.addEventListener('click', () => {
          this.onSort(column.key, direction === 'asc' ? 'desc' : 'asc');
        });
        cell.append(button);
      } else {
        cell.textContent = column.label;
      }
      headRow.append(cell);
    });

    head.append(headRow);
    const body = createElement('tbody');
    items.forEach((item) => {
      const row = createElement('tr');
      this.columns.forEach((column) => {
        const cell = createElement('td');
        const value = column.render ? column.render(item) : item[column.key];
        if (value instanceof Node) cell.append(value);
        else cell.textContent = value == null || value === '' ? '—' : String(value);
        row.append(cell);
      });
      body.append(row);
    });
    table.append(head, body);
    wrapper.append(table);
    this.container.replaceChildren(wrapper);
  }
}

function sortIndicator(direction) {
  if (direction === 'asc') return ' ↑';
  if (direction === 'desc') return ' ↓';
  return '';
}
