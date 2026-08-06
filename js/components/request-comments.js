import { createElement } from './dom.js';
import { Pagination } from './pagination.js';

export class RequestComments {
  constructor({ i18n, canAddInternal, onLoad, onAdd }) {
    this.i18n = i18n;
    this.canAddInternal = canAddInternal;
    this.onLoad = onLoad;
    this.onAdd = onAdd;
    this.page = 1;
    this.element = this.create();
  }

  async load(page = this.page) {
    this.page = page;
    this.list.replaceChildren(createElement('p', { className: 'text-body-secondary', text: this.i18n.t('states.loading') }));
    try {
      const result = await this.onLoad({ page, pageSize: 10 });
      const items = Array.isArray(result?.items) ? result.items : [];
      this.renderItems(items);
      this.pagination.render({ page: result?.page || page, totalPages: result?.totalPages || 0, total: result?.total || 0 });
    } catch {
      this.list.replaceChildren(createElement('p', { className: 'text-danger', text: this.i18n.t('requestCard.commentsLoadError') }));
    }
  }

  create() {
    const card = createElement('section', { className: 'card border-0 shadow-sm' });
    const body = createElement('div', { className: 'card-body' });
    body.append(createElement('h2', { className: 'h5', text: this.i18n.t('requestCard.comments') }));
    this.form = createElement('form', { className: 'mb-4' });
    this.text = createElement('textarea', { className: 'form-control', attributes: { rows: '3', maxlength: '4000', required: 'required', 'aria-label': this.i18n.t('requestCard.commentText') } });
    this.type = createElement('select', { className: 'form-select', attributes: { 'aria-label': this.i18n.t('requestCard.commentType') } });
    this.type.append(option('PUBLIC', this.i18n.t('requestCard.publicComment')));
    if (this.canAddInternal) this.type.append(option('INTERNAL', this.i18n.t('requestCard.internalComment')));
    this.submit = createElement('button', { className: 'btn btn-primary', text: this.i18n.t('requestCard.addComment'), attributes: { type: 'submit' } });
    const controls = createElement('div', { className: 'd-flex flex-column flex-md-row gap-2 mt-2' });
    controls.append(this.type, this.submit);
    this.message = createElement('div', { className: 'small mt-2', attributes: { role: 'alert' } });
    this.form.append(this.text, controls, this.message);
    this.form.addEventListener('submit', (event) => this.submitComment(event));
    this.list = createElement('div', { className: 'vstack gap-3' });
    const paginationHost = createElement('div', { className: 'mt-3' });
    this.pagination = new Pagination(paginationHost, { i18n: this.i18n, onPageChange: (page) => this.load(page) });
    body.append(this.form, this.list, paginationHost);
    card.append(body);
    return card;
  }

  async submitComment(event) {
    event.preventDefault();
    const text = this.text.value.trim();
    if (!text) return;
    this.submit.disabled = true;
    this.message.textContent = '';
    try {
      await this.onAdd({ type: this.type.value, text });
      this.text.value = '';
      await this.load(1);
    } catch (error) {
      this.message.className = 'small text-danger mt-2';
      this.message.textContent = error?.code === 'VERSION_CONFLICT'
        ? this.i18n.t('requestCard.versionConflict') : this.i18n.t('requestCard.commentError');
    } finally { this.submit.disabled = false; }
  }

  renderItems(items) {
    this.list.replaceChildren();
    if (!items.length) {
      this.list.append(createElement('p', { className: 'text-body-secondary', text: this.i18n.t('requestCard.noComments') }));
      return;
    }
    items.forEach((item) => {
      const article = createElement('article', { className: 'border rounded p-3' });
      const meta = createElement('div', { className: 'd-flex justify-content-between gap-2 mb-2' });
      meta.append(createElement('strong', { text: item.authorTitle || item.author?.title || '—' }),
        createElement('span', { className: `badge ${item.type === 'INTERNAL' ? 'text-bg-warning' : 'text-bg-secondary'}`, text: this.i18n.t(`requestCard.commentTypes.${item.type || 'PUBLIC'}`) }));
      article.append(meta, createElement('p', { className: 'mb-1 request-comment-text', text: item.text || '' }),
        createElement('small', { className: 'text-body-secondary', text: formatDate(item.createdAt, this.i18n.getLanguage()) }));
      this.list.append(article);
    });
  }
}

function option(value, text) { return createElement('option', { text, attributes: { value } }); }
function formatDate(value, language) { const date = new Date(value); return value && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(date) : '—'; }
