import { initializeProtectedPage } from '../app.js';
import { apiClient } from '../auth.js';
import { FormsApi } from '../api/forms-api.js';
import { PAGE_ROLES } from '../core/permissions.js';
import { I18n } from '../i18n/index.js';
import { DataTable } from '../components/data-table.js';
import { Pagination } from '../components/pagination.js';
import { createElement } from '../components/dom.js';
import { createEmptyState, createErrorState, createLoadingState } from '../components/page-states.js';

const pageContent = createElement('section', { className: 'forms-page' });
const page = await initializeProtectedPage({
  titleKey: 'pages.forms',
  activeNav: 'admin-forms',
  requiredRoles: PAGE_ROLES.forms,
  content: pageContent
});

if (page?.accessStatus === 'ready') {
  const formsApi = new FormsApi(apiClient);
  const state = {
    page: 1,
    pageSize: 20,
    filters: { search: '', statuses: [] },
    sort: [{ field: 'updatedAt', direction: 'desc' }]
  };
  let requestSequence = 0;

  const controls = createControls();
  const resultRegion = createElement('div', { attributes: { 'aria-live': 'polite' } });
  const tableRegion = createElement('div', { className: 'card border-0 shadow-sm' });
  const paginationRegion = createElement('div', { className: 'forms-pagination d-flex flex-column align-items-end mt-3' });
  pageContent.append(controls.container, resultRegion, tableRegion, paginationRegion);

  const table = new DataTable(tableRegion, {
    i18n: I18n,
    columns: createColumns(),
    onSort: (field, direction) => {
      state.sort = [{ field, direction }];
      state.page = 1;
      loadForms();
    }
  });
  const pagination = new Pagination(paginationRegion, {
    i18n: I18n,
    onPageChange: (targetPage) => {
      state.page = targetPage;
      loadForms();
    }
  });

  controls.form.addEventListener('submit', (event) => {
    event.preventDefault();
    state.filters.search = controls.search.value.trim();
    state.page = 1;
    loadForms();
  });
  controls.status.addEventListener('change', () => {
    state.filters.statuses = controls.status.value ? [controls.status.value] : [];
    state.page = 1;
    loadForms();
  });

  await loadForms();

  async function loadForms() {
    const sequence = ++requestSequence;
    resultRegion.replaceChildren(createLoadingState(I18n));
    tableRegion.classList.add('d-none');
    paginationRegion.replaceChildren();

    try {
      const result = await formsApi.getList({
        page: state.page,
        pageSize: state.pageSize,
        filters: { ...state.filters },
        sort: state.sort.map((item) => ({ ...item }))
      });
      if (sequence !== requestSequence) return;

      const items = Array.isArray(result?.items) ? result.items : [];
      resultRegion.replaceChildren();
      if (items.length === 0) {
        tableRegion.classList.add('d-none');
        resultRegion.append(createEmptyState(I18n, 'forms.empty'));
        return;
      }

      tableRegion.classList.remove('d-none');
      table.render(items, state.sort);
      pagination.render({
        page: result.page || state.page,
        totalPages: result.totalPages || 1,
        total: result.total || items.length
      });
    } catch {
      if (sequence !== requestSequence) return;
      const errorState = createErrorState(I18n, 'forms.loadError');
      const retry = createElement('button', {
        className: 'btn btn-primary mt-3', text: I18n.t('common.retry'), attributes: { type: 'button' }
      });
      retry.addEventListener('click', loadForms);
      errorState.querySelector('.app-state__body').append(retry);
      resultRegion.replaceChildren(errorState);
      tableRegion.classList.add('d-none');
    }
  }

  function createControls() {
    const container = createElement('div', { className: 'card border-0 shadow-sm mb-3' });
    const body = createElement('div', { className: 'card-body' });
    const top = createElement('div', { className: 'd-flex flex-column flex-lg-row gap-3 justify-content-between' });
    const form = createElement('form', { className: 'row g-2 flex-grow-1', attributes: { role: 'search' } });
    const searchGroup = createElement('div', { className: 'col-12 col-md' });
    const search = createElement('input', {
      className: 'form-control',
      attributes: { type: 'search', placeholder: I18n.t('forms.searchPlaceholder'), 'aria-label': I18n.t('forms.search') }
    });
    searchGroup.append(search);
    const statusGroup = createElement('div', { className: 'col-12 col-md-auto' });
    const status = createElement('select', {
      className: 'form-select', attributes: { 'aria-label': I18n.t('forms.statusFilter') }
    });
    appendOption(status, '', I18n.t('forms.allStatuses'));
    appendOption(status, 'DRAFT', I18n.t('forms.status.DRAFT'));
    appendOption(status, 'PUBLISHED', I18n.t('forms.status.PUBLISHED'));
    appendOption(status, 'ARCHIVED', I18n.t('forms.status.ARCHIVED'));
    statusGroup.append(status);
    const submitGroup = createElement('div', { className: 'col-12 col-md-auto' });
    submitGroup.append(createElement('button', {
      className: 'btn btn-outline-primary w-100', text: I18n.t('common.search'), attributes: { type: 'submit' }
    }));
    form.append(searchGroup, statusGroup, submitGroup);
    const createLink = createElement('a', {
      className: 'btn btn-primary flex-shrink-0', text: I18n.t('forms.create'),
      attributes: { href: 'form-editor.html?mode=create' }
    });
    top.append(form, createLink);
    body.append(top);
    container.append(body);
    return { container, form, search, status };
  }

  function createColumns() {
    return [
      { key: 'code', label: I18n.t('forms.columns.code'), sortable: true },
      { key: 'title', label: I18n.t('forms.columns.title'), sortable: true, render: (form) => localizedTitle(form.title) },
      { key: 'status', label: I18n.t('forms.columns.status'), sortable: true, render: (form) => statusBadge(form.status) },
      { key: 'currentPublishedVersion', label: I18n.t('forms.columns.publishedVersion'), render: publishedVersion },
      { key: 'activeDraftVersion', label: I18n.t('forms.columns.draft'), render: draftBadge },
      { key: 'updatedAt', label: I18n.t('forms.columns.updatedAt'), sortable: true, render: (form) => formatDate(form.updatedAt) },
      { key: 'actions', label: I18n.t('forms.columns.actions'), render: actionButtons }
    ];
  }

  function actionButtons(form) {
    const group = createElement('div', { className: 'btn-group btn-group-sm', attributes: { role: 'group' } });
    group.append(
      actionLink(I18n.t('common.edit'), 'form-editor.html?formId=' + encodeURIComponent(form.id)),
      actionLink(I18n.t('forms.history'), 'form-editor.html?formId=' + encodeURIComponent(form.id) + '&view=history')
    );
    return group;
  }
}

function actionLink(label, href) {
  return createElement('a', { className: 'btn btn-outline-primary', text: label, attributes: { href } });
}

function appendOption(select, value, label) {
  select.append(createElement('option', { text: label, attributes: { value } }));
}

function localizedTitle(title) {
  if (typeof title === 'string') return title;
  return title?.[I18n.getLanguage()] || title?.ru || title?.en || '—';
}

function publishedVersion(form) {
  const version = form.currentPublishedVersion;
  if (version == null) return I18n.t('forms.notPublished');
  if (typeof version === 'object') return String(version.versionNumber ?? version.version ?? version.id ?? '—');
  return String(version);
}

function draftBadge(form) {
  const hasDraft = Boolean(form.activeDraftVersion);
  return createElement('span', {
    className: 'badge ' + (hasDraft ? 'text-bg-warning' : 'text-bg-secondary'),
    text: I18n.t(hasDraft ? 'common.yes' : 'common.no')
  });
}

function statusBadge(status) {
  return createElement('span', {
    className: 'badge text-bg-secondary',
    text: I18n.t('forms.status.' + (status || 'UNKNOWN'))
  });
}

function formatDate(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(I18n.getLanguage(), { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
