import { createElement } from './dom.js';
import { DataTable } from './data-table.js';
import { Pagination } from './pagination.js';

export class ProfileRequestList {
  constructor({ i18n, title, load }) {
    this.i18n = i18n; this.loadPage = load;
    this.state = { page: 1, pageSize: 10, sort: [{ field: 'createdAt', direction: 'desc' }] };
    this.element = createElement('section', { className: 'card border-0 shadow-sm' });
    const body = createElement('div', { className: 'card-body' });
    body.append(createElement('h2', { className: 'h5', text: title }));
    this.stateHost = createElement('div', { attributes: { 'aria-live': 'polite' } });
    this.tableHost = createElement('div', { className: 'profile-request-table' });
    this.paginationHost = createElement('div', { className: 'mt-3' });
    body.append(this.stateHost, this.tableHost, this.paginationHost); this.element.append(body);
    this.table = new DataTable(this.tableHost, { i18n, columns: columns(i18n), onSort: (field, direction) => { this.state.sort = [{ field, direction }]; this.state.page = 1; this.load(); } });
    this.pagination = new Pagination(this.paginationHost, { i18n, onPageChange: (page) => { this.state.page = page; this.load(); } });
  }
  async load() {
    this.stateHost.textContent = this.i18n.t('states.loading'); this.tableHost.replaceChildren(); this.paginationHost.replaceChildren();
    try {
      const result = await this.loadPage({ page: this.state.page, pageSize: this.state.pageSize, filters: {}, sort: this.state.sort.map((item) => ({ ...item })) });
      const items = Array.isArray(result?.items) ? result.items : [];
      this.stateHost.textContent = '';
      if (!items.length) { this.stateHost.textContent = this.i18n.t('profile.noRequests'); return; }
      this.table.render(items, this.state.sort);
      this.pagination.render({ page: result.page || this.state.page, totalPages: result.totalPages || 0, total: result.total || 0 });
    } catch { this.stateHost.textContent = this.i18n.t('profile.requestsLoadError'); }
  }
}

function columns(i18n) {
  return [
    { key: 'number', label: i18n.t('requests.columns.number'), sortable: true, render: link },
    { key: 'title', label: i18n.t('requests.columns.title'), sortable: true },
    { key: 'status', label: i18n.t('requests.columns.status'), sortable: true, render: (item) => i18n.t(`requests.status.${item.status || 'UNKNOWN'}`) },
    { key: 'createdAt', label: i18n.t('requests.columns.createdAt'), sortable: true, render: (item) => date(item.createdAt, i18n.getLanguage()) }
  ];
}
function link(item) { const id = item.id || item.entityId; return id ? createElement('a', { text: item.number || id, attributes: { href: `request-card.html?id=${encodeURIComponent(id)}` } }) : item.number || '—'; }
function date(value, language) { const parsed = new Date(value); return value && !Number.isNaN(parsed.getTime()) ? new Intl.DateTimeFormat(language, { dateStyle: 'short', timeStyle: 'short' }).format(parsed) : '—'; }
