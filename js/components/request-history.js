import { createElement } from './dom.js';
import { Pagination } from './pagination.js';

const EVENT_TYPES = new Set(['CREATED', 'STATUS_CHANGED', 'ASSIGNMENT_CHANGED', 'FIELDS_CHANGED', 'COMMENT_ADDED', 'ATTACHMENT_ADDED', 'SLA_CALCULATED', 'SLA_PAUSED', 'SLA_RESUMED', 'SLA_RULE_CONFLICT']);

export class RequestHistory {
  constructor({ i18n, onLoad }) {
    this.i18n = i18n;
    this.onLoad = onLoad;
    this.element = this.create();
  }
  create() {
    const card = createElement('section', { className: 'card border-0 shadow-sm' });
    const body = createElement('div', { className: 'card-body' });
    body.append(createElement('h2', { className: 'h5', text: this.i18n.t('requestCard.history') }));
    this.list = createElement('ol', { className: 'list-group list-group-flush' });
    const host = createElement('div', { className: 'mt-3' });
    this.pagination = new Pagination(host, { i18n: this.i18n, onPageChange: (page) => this.load(page) });
    body.append(this.list, host); card.append(body); return card;
  }
  async load(page = 1) {
    this.list.replaceChildren(createElement('li', { className: 'list-group-item text-body-secondary', text: this.i18n.t('states.loading') }));
    try {
      const result = await this.onLoad({ page, pageSize: 20 });
      const items = Array.isArray(result?.items) ? result.items : [];
      this.list.replaceChildren();
      if (!items.length) this.list.append(createElement('li', { className: 'list-group-item text-body-secondary', text: this.i18n.t('requestCard.noHistory') }));
      items.forEach((item) => {
        const row = createElement('li', { className: 'list-group-item px-0' });
        const eventType = EVENT_TYPES.has(item.eventType) ? item.eventType : 'UNKNOWN';
        row.append(createElement('strong', { text: this.i18n.t(`requestCard.events.${eventType}`) }),
          createElement('div', { className: 'small text-body-secondary', text: `${item.actorTitle || item.actor?.title || '—'} · ${formatDate(item.occurredAt, this.i18n.getLanguage())}` }));
        this.list.append(row);
      });
      this.pagination.render({ page: result?.page || page, totalPages: result?.totalPages || 0, total: result?.total || 0 });
    } catch { this.list.replaceChildren(createElement('li', { className: 'list-group-item text-danger', text: this.i18n.t('requestCard.historyLoadError') })); }
  }
}
function formatDate(value, language) { const date = new Date(value); return value && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(date) : '—'; }
