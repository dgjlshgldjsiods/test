import { initializeProtectedPage } from '../app.js';
import { apiClient } from '../auth.js';
import { RequestsApi } from '../api/requests-api.js';
import { PAGE_ROLES } from '../core/permissions.js';
import { I18n } from '../i18n/index.js';
import { createElement } from '../components/dom.js';
import { DataTable } from '../components/data-table.js';
import { Pagination } from '../components/pagination.js';
import { RequestFilters } from '../components/request-filters.js';
import { createSlaIndicator } from '../components/sla-indicator.js';
import { createEmptyState, createErrorState, createForbiddenState, createLoadingState } from '../components/page-states.js';

const content = createElement('section', { className: 'requests-list-page' });
const page = await initializeProtectedPage({
  titleKey: 'pages.requests', activeNav: 'requests', requiredRoles: PAGE_ROLES.requests, content
});

if (page?.accessStatus === 'ready') {
  const api = new RequestsApi(apiClient);
  const state = {
    page: 1, pageSize: 20, filters: {},
    sort: [{ field: 'createdAt', direction: 'desc' }]
  };
  let sequence = 0;
  const filters = new RequestFilters({
    i18n: I18n,
    onApply: (value) => { state.filters = value; state.page = 1; loadRequests(); }
  });
  const stateRegion = createElement('div', { attributes: { 'aria-live': 'polite' } });
  const tableRegion = createElement('div', { className: 'card border-0 shadow-sm requests-table' });
  const paginationRegion = createElement('div', { className: 'd-flex flex-column align-items-end mt-3' });
  content.append(filters.element, stateRegion, tableRegion, paginationRegion);

  const table = new DataTable(tableRegion, {
    i18n: I18n,
    columns: columns(),
    onSort: (field, direction) => { state.sort = [{ field, direction }]; state.page = 1; loadRequests(); }
  });
  const pagination = new Pagination(paginationRegion, {
    i18n: I18n,
    onPageChange: (targetPage) => { state.page = targetPage; loadRequests(); }
  });
  await loadRequests();

  async function loadRequests() {
    const current = ++sequence;
    stateRegion.replaceChildren(createLoadingState(I18n));
    tableRegion.classList.add('d-none');
    paginationRegion.replaceChildren();
    try {
      const result = await api.getList({
        page: state.page, pageSize: state.pageSize,
        filters: structuredCloneSafe(state.filters),
        sort: state.sort.map((item) => ({ ...item }))
      });
      if (current !== sequence) return;
      const items = Array.isArray(result?.items) ? result.items : [];
      stateRegion.replaceChildren();
      if (!items.length) {
        stateRegion.append(createEmptyState(I18n, 'requests.empty'));
        return;
      }
      tableRegion.classList.remove('d-none');
      table.render(items, state.sort);
      pagination.render({
        page: result.page || state.page,
        totalPages: result.totalPages || 1,
        total: result.total ?? items.length
      });
    } catch (error) {
      if (current !== sequence) return;
      const errorState = error?.code === 'FORBIDDEN'
        ? createForbiddenState(I18n)
        : createErrorState(I18n, 'requests.loadError');
      if (error?.code !== 'FORBIDDEN') {
        const retry = createElement('button', { className: 'btn btn-primary mt-3', text: I18n.t('common.retry'), attributes: { type: 'button' } });
        retry.addEventListener('click', loadRequests);
        errorState.querySelector('.app-state__body').append(retry);
      }
      stateRegion.replaceChildren(errorState);
    }
  }

  function columns() {
    return [
      { key: 'number', label: I18n.t('requests.columns.number'), sortable: true, render: requestLink },
      { key: 'title', label: I18n.t('requests.columns.title'), sortable: true },
      { key: 'serviceTitle', label: I18n.t('requests.columns.service'), sortable: true, render: (item) => localized(item.serviceTitle || item.service?.title) },
      { key: 'authorTitle', label: I18n.t('requests.columns.author'), sortable: true, render: referenceTitle('author') },
      { key: 'status', label: I18n.t('requests.columns.status'), sortable: true, render: statusBadge },
      { key: 'responsibleGroupTitle', label: I18n.t('requests.columns.group'), sortable: true, render: referenceTitle('responsibleGroup') },
      { key: 'assigneeTitle', label: I18n.t('requests.columns.assignee'), sortable: true, render: referenceTitle('assignee') },
      { key: 'reactionDeadline', label: I18n.t('requests.columns.reaction'), sortable: true, render: (item) => formatDate(item.reactionDeadline || item.sla?.reactionDeadline) },
      { key: 'resolutionDeadline', label: I18n.t('requests.columns.resolution'), sortable: true, render: (item) => formatDate(item.resolutionDeadline || item.sla?.resolutionDeadline) },
      { key: 'slaState', label: I18n.t('requests.columns.sla'), render: (item) => createSlaIndicator(item.sla, I18n) },
      { key: 'createdAt', label: I18n.t('requests.columns.createdAt'), sortable: true, render: (item) => formatDate(item.createdAt) }
    ];
  }
}

function requestLink(item) {
  const id = item.id || item.entityId;
  if (!id) return item.number || '—';
  return createElement('a', {
    className: 'fw-semibold', text: item.number || id,
    attributes: { href: 'request-card.html?id=' + encodeURIComponent(id) }
  });
}
function statusBadge(item) { return createElement('span', { className: 'badge text-bg-secondary', text: I18n.t(`requests.status.${item.status || 'UNKNOWN'}`) }); }
function referenceTitle(key) { return (item) => item[`${key}Title`] || localized(item[key]?.title) || '—'; }
function localized(value) { return typeof value === 'string' ? value : value?.[I18n.getLanguage()] || value?.ru || value?.en || '—'; }
function formatDate(value) { const date = new Date(value); return value && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(I18n.getLanguage(), { dateStyle: 'short', timeStyle: 'short' }).format(date) : '—'; }
function structuredCloneSafe(value) { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
