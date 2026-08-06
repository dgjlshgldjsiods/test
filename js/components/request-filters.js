import { createElement } from './dom.js';

const STATUSES = ['NEW', 'REGISTERED', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED', 'CANCELLED'];

export class RequestFilters {
  constructor(options) {
    this.i18n = options.i18n;
    this.onApply = options.onApply || (() => {});
    this.element = this.create();
  }

  getValue() {
    const data = new FormData(this.form);
    return {
      search: text(data, 'search'),
      number: text(data, 'number'),
      title: text(data, 'title'),
      statuses: data.get('status') ? [text(data, 'status')] : [],
      service: text(data, 'service'),
      author: text(data, 'author'),
      requestedFor: text(data, 'requestedFor'),
      responsibleGroup: text(data, 'responsibleGroup'),
      assignee: text(data, 'assignee'),
      createdFrom: isoDateOrNull(data, 'createdFrom'),
      createdTo: isoDateOrNull(data, 'createdTo'),
      slaBreached: booleanOrNull(data.get('slaBreached')),
      reactionDeadlineFrom: isoDateOrNull(data, 'reactionDeadlineFrom'),
      reactionDeadlineTo: isoDateOrNull(data, 'reactionDeadlineTo'),
      resolutionDeadlineFrom: isoDateOrNull(data, 'resolutionDeadlineFrom'),
      resolutionDeadlineTo: isoDateOrNull(data, 'resolutionDeadlineTo')
    };
  }

  create() {
    const card = createElement('div', { className: 'card border-0 shadow-sm mb-3' });
    this.form = createElement('form', { className: 'card-body' });
    const primary = createElement('div', { className: 'row g-2 align-items-end' });
    primary.append(field('search', this.i18n.t('requests.filters.search'), 'search', 'col-12 col-lg-5'),
      field('number', this.i18n.t('requests.filters.number'), 'text', 'col-6 col-lg-2'),
      selectField('status', this.i18n.t('requests.filters.status'), STATUSES, this.i18n, 'col-6 col-lg-3'));
    const actions = createElement('div', { className: 'col-12 col-lg-2 d-flex gap-2' });
    actions.append(createElement('button', { className: 'btn btn-primary flex-grow-1', text: this.i18n.t('requests.apply'), attributes: { type: 'submit' } }),
      createElement('button', { className: 'btn btn-outline-secondary', text: this.i18n.t('requests.moreFilters'), attributes: { type: 'button', 'data-bs-toggle': 'collapse', 'data-bs-target': '#request-more-filters' } }));
    primary.append(actions);

    const more = createElement('div', { className: 'collapse mt-3', attributes: { id: 'request-more-filters' } });
    const grid = createElement('div', { className: 'row g-2' });
    grid.append(
      field('title', this.i18n.t('requests.filters.title')),
      field('service', this.i18n.t('requests.filters.service')),
      field('author', this.i18n.t('requests.filters.author')),
      field('requestedFor', this.i18n.t('requests.filters.requestedFor')),
      field('responsibleGroup', this.i18n.t('requests.filters.group')),
      field('assignee', this.i18n.t('requests.filters.assignee')),
      field('createdFrom', this.i18n.t('requests.filters.createdFrom'), 'datetime-local'),
      field('createdTo', this.i18n.t('requests.filters.createdTo'), 'datetime-local'),
      selectField('slaBreached', this.i18n.t('requests.filters.slaBreached'), ['true', 'false'], this.i18n),
      field('reactionDeadlineFrom', this.i18n.t('requests.filters.reactionFrom'), 'datetime-local'),
      field('reactionDeadlineTo', this.i18n.t('requests.filters.reactionTo'), 'datetime-local'),
      field('resolutionDeadlineFrom', this.i18n.t('requests.filters.resolutionFrom'), 'datetime-local'),
      field('resolutionDeadlineTo', this.i18n.t('requests.filters.resolutionTo'), 'datetime-local')
    );
    more.append(grid);
    this.form.append(primary, more);
    this.form.addEventListener('submit', (event) => { event.preventDefault(); this.onApply(this.getValue()); });
    card.append(this.form);
    return card;
  }
}

function field(name, label, type = 'text', className = 'col-12 col-md-6 col-xl-4') {
  const wrap = createElement('div', { className });
  wrap.append(createElement('label', { className: 'form-label small', text: label, attributes: { for: `request-filter-${name}` } }),
    createElement('input', { className: 'form-control', attributes: { id: `request-filter-${name}`, name, type } }));
  return wrap;
}

function selectField(name, label, values, i18n, className = 'col-12 col-md-6 col-xl-4') {
  const wrap = createElement('div', { className });
  const select = createElement('select', { className: 'form-select', attributes: { id: `request-filter-${name}`, name } });
  select.append(createElement('option', { text: i18n.t('requests.filters.any'), attributes: { value: '' } }));
  values.forEach((value) => select.append(createElement('option', {
    text: name === 'status' ? i18n.t(`requests.status.${value}`) : i18n.t(`requests.filterValue.${value}`),
    attributes: { value }
  })));
  wrap.append(createElement('label', { className: 'form-label small', text: label, attributes: { for: `request-filter-${name}` } }), select);
  return wrap;
}

function text(data, name) { return String(data.get(name) || '').trim(); }
function isoDateOrNull(data, name) {
  const value = text(data, name);
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
function booleanOrNull(value) { return value === 'true' ? true : value === 'false' ? false : null; }
