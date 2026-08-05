import { createElement } from './dom.js';

export class Pagination {
  constructor(container, options) {
    this.container = container;
    this.i18n = options.i18n;
    this.onPageChange = options.onPageChange || (() => {});
  }

  render({ page, totalPages, total }) {
    this.container.replaceChildren();
    if (!totalPages || totalPages <= 1) {
      this.container.append(createSummary(this.i18n, total));
      return;
    }

    const nav = createElement('nav', { attributes: { 'aria-label': this.i18n.t('pagination.label') } });
    const list = createElement('ul', { className: 'pagination mb-0 flex-wrap' });
    list.append(this.createItem(this.i18n.t('pagination.previous'), page - 1, page <= 1));

    pageRange(page, totalPages).forEach((pageNumber) => {
      list.append(this.createItem(String(pageNumber), pageNumber, false, pageNumber === page));
    });

    list.append(this.createItem(this.i18n.t('pagination.next'), page + 1, page >= totalPages));
    nav.append(list);
    this.container.append(createSummary(this.i18n, total), nav);
  }

  createItem(label, targetPage, disabled, active = false) {
    const item = createElement('li', {
      className: 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '')
    });
    const button = createElement('button', {
      className: 'page-link', text: label,
      attributes: { type: 'button', 'aria-current': active ? 'page' : 'false' }
    });
    button.disabled = disabled;
    button.addEventListener('click', () => this.onPageChange(targetPage));
    item.append(button);
    return item;
  }
}

function pageRange(page, totalPages) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = [];
  for (let value = start; value <= end; value += 1) pages.push(value);
  return pages;
}

function createSummary(i18n, total) {
  return createElement('p', {
    className: 'small text-body-secondary mb-2',
    text: i18n.t('pagination.total', { total: total || 0 })
  });
}
