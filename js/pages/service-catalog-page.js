import { initializeProtectedPage } from '../app.js';
import { apiClient } from '../auth.js';
import { CatalogApi } from '../api/catalog-api.js';
import { I18n } from '../i18n/index.js';
import { createElement } from '../components/dom.js';
import { createEmptyState, createErrorState, createLoadingState } from '../components/page-states.js';

const VIEW_STORAGE_KEY = 'itsm.catalog.view';
const content = createElement('section', { className: 'service-catalog-page' });
const page = await initializeProtectedPage({
  titleKey: 'pages.serviceCatalog', activeNav: 'catalog', content
});

if (page?.accessStatus === 'ready') {
  const catalogApi = new CatalogApi(apiClient);
  const state = {
    tree: { folders: [], services: [] }, folderId: null, search: '',
    view: readViewMode()
  };
  await loadCatalog();

  async function loadCatalog() {
    content.replaceChildren(createLoadingState(I18n));
    try {
      const result = await catalogApi.getAvailableTree(state.search);
      // The response is already filtered by the server. Do not expand it with
      // cached/admin data or treat the client matcher as an authorization rule.
      state.tree = {
        folders: Array.isArray(result?.folders) ? result.folders : [],
        services: Array.isArray(result?.services) ? result.services.filter((service) => service.status === 'PUBLISHED') : []
      };
      if (state.folderId && !state.tree.folders.some((folder) => folder.id === state.folderId)) state.folderId = null;
      renderCatalog();
    } catch {
      const error = createErrorState(I18n, 'serviceCatalog.loadError');
      const retry = createElement('button', { className: 'btn btn-primary mt-3', text: I18n.t('common.retry'), attributes: { type: 'button' } });
      retry.addEventListener('click', loadCatalog);
      error.querySelector('.app-state__body').append(retry);
      content.replaceChildren(error);
    }
  }

  function renderCatalog() {
    const controls = createControls();
    const layout = createElement('div', { className: 'row g-3' });
    const treeColumn = createElement('aside', { className: 'col-12 col-lg-4 col-xl-3' });
    treeColumn.append(createFolderTree());
    const resultColumn = createElement('div', { className: 'col-12 col-lg-8 col-xl-9' });
    resultColumn.append(createBreadcrumbs(), createResults());
    layout.append(treeColumn, resultColumn);
    content.replaceChildren(controls, layout);
  }

  function createControls() {
    const toolbar = createElement('div', { className: 'card border-0 shadow-sm mb-3' });
    const body = createElement('div', { className: 'card-body d-flex flex-column flex-md-row gap-3 justify-content-between' });
    const searchForm = createElement('form', { className: 'input-group', attributes: { role: 'search' } });
    const search = createElement('input', {
      className: 'form-control',
      attributes: { type: 'search', value: state.search, placeholder: I18n.t('serviceCatalog.searchPlaceholder'), 'aria-label': I18n.t('common.search') }
    });
    search.value = state.search;
    searchForm.append(search, createElement('button', { className: 'btn btn-primary', text: I18n.t('common.search'), attributes: { type: 'submit' } }));
    searchForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      state.search = search.value.trim();
      state.folderId = null;
      await loadCatalog();
    });
    const viewGroup = createElement('div', { className: 'btn-group flex-shrink-0', attributes: { role: 'group', 'aria-label': I18n.t('serviceCatalog.viewMode') } });
    viewGroup.append(viewButton('cards', I18n.t('serviceCatalog.cards')), viewButton('list', I18n.t('serviceCatalog.list')));
    body.append(searchForm, viewGroup);
    toolbar.append(body);
    return toolbar;
  }

  function viewButton(mode, label) {
    const value = createElement('button', {
      className: 'btn ' + (state.view === mode ? 'btn-primary' : 'btn-outline-primary'),
      text: label, attributes: { type: 'button', 'aria-pressed': String(state.view === mode) }
    });
    value.addEventListener('click', () => {
      state.view = mode;
      try { localStorage.setItem(VIEW_STORAGE_KEY, mode); } catch { /* preference is optional */ }
      renderCatalog();
    });
    return value;
  }

  function createFolderTree() {
    const card = createElement('div', { className: 'card border-0 shadow-sm' });
    const header = createElement('div', { className: 'card-header bg-body fw-semibold', text: I18n.t('serviceCatalog.folders') });
    const nav = createElement('nav', { className: 'list-group list-group-flush catalog-user-tree', attributes: { 'aria-label': I18n.t('serviceCatalog.folders') } });
    nav.append(folderButton(null, I18n.t('serviceCatalog.allServices'), 0));
    childrenOf(null).forEach((folder) => appendFolderBranch(nav, folder, 0));
    card.append(header, nav);
    return card;
  }

  function appendFolderBranch(target, folder, depth) {
    target.append(folderButton(folder.id, localized(folder.title), depth));
    childrenOf(folder.id).forEach((child) => appendFolderBranch(target, child, depth + 1));
  }

  function folderButton(folderId, label, depth) {
    const value = createElement('button', {
      className: 'list-group-item list-group-item-action text-start' + (state.folderId === folderId ? ' active' : ''),
      text: label, attributes: { type: 'button' }
    });
    value.style.paddingInlineStart = `${1 + depth * 1.1}rem`;
    value.addEventListener('click', () => { state.folderId = folderId; state.search = ''; renderCatalog(); });
    return value;
  }

  function createBreadcrumbs() {
    const nav = createElement('nav', { attributes: { 'aria-label': I18n.t('serviceCatalog.breadcrumbs') } });
    const list = createElement('ol', { className: 'breadcrumb mb-3' });
    list.append(breadcrumb(null, I18n.t('serviceCatalog.root'), !state.folderId));
    folderPath(state.folderId).forEach((folder, index, path) => list.append(breadcrumb(folder.id, localized(folder.title), index === path.length - 1)));
    nav.append(list);
    return nav;
  }

  function breadcrumb(folderId, label, current) {
    const item = createElement('li', { className: 'breadcrumb-item' + (current ? ' active' : '') });
    if (current) { item.textContent = label; item.setAttribute('aria-current', 'page'); }
    else {
      const link = createElement('button', { className: 'btn btn-link p-0 align-baseline', text: label, attributes: { type: 'button' } });
      link.addEventListener('click', () => { state.folderId = folderId; state.search = ''; renderCatalog(); });
      item.append(link);
    }
    return item;
  }

  function createResults() {
    const region = createElement('div', { attributes: { 'aria-live': 'polite' } });
    const folders = state.search ? [] : childrenOf(state.folderId);
    const services = (state.search || state.folderId === null
      ? state.tree.services
      : state.tree.services.filter((service) => (service.folderId || null) === state.folderId)).sort(byOrder);
    if (!folders.length && !services.length) return createEmptyState(I18n, state.search ? 'serviceCatalog.searchEmpty' : 'serviceCatalog.empty');
    if (state.view === 'cards') {
      const grid = createElement('div', { className: 'row g-3' });
      folders.forEach((folder) => grid.append(folderCard(folder)));
      services.forEach((service) => grid.append(serviceCard(service)));
      region.append(grid);
    } else {
      const list = createElement('div', { className: 'list-group shadow-sm' });
      folders.forEach((folder) => list.append(folderListItem(folder)));
      services.forEach((service) => list.append(serviceListItem(service)));
      region.append(list);
    }
    return region;
  }

  function folderCard(folder) {
    const column = createElement('div', { className: 'col-12 col-md-6 col-xxl-4' });
    const card = createElement('button', { className: 'card catalog-card catalog-folder-card h-100 w-100 text-start', attributes: { type: 'button' } });
    const body = createElement('div', { className: 'card-body' });
    body.append(createElement('div', { className: 'catalog-card__icon', text: '📁' }), createElement('h2', { className: 'h5', text: localized(folder.title) }));
    card.append(body); card.addEventListener('click', () => { state.folderId = folder.id; renderCatalog(); }); column.append(card); return column;
  }

  function serviceCard(service) {
    const column = createElement('div', { className: 'col-12 col-md-6 col-xxl-4' });
    const link = createElement('a', { className: 'card catalog-card h-100 text-decoration-none', attributes: { href: serviceUrl(service.id) } });
    const body = createElement('div', { className: 'card-body' });
    body.append(createElement('div', { className: 'catalog-card__icon', text: safeIcon(service.icon) }), createElement('h2', { className: 'h5', text: localized(service.title) }),
      createElement('p', { className: 'text-body-secondary mb-2', text: localized(service.shortDescription, '') }),
      createElement('div', { className: 'small text-body-secondary', text: servicePath(service) }));
    link.append(body); column.append(link); return column;
  }

  function folderListItem(folder) {
    const value = createElement('button', { className: 'list-group-item list-group-item-action d-flex gap-3', attributes: { type: 'button' } });
    value.append(createElement('span', { text: '📁' }), createElement('span', { className: 'fw-semibold', text: localized(folder.title) }));
    value.addEventListener('click', () => { state.folderId = folder.id; renderCatalog(); }); return value;
  }

  function serviceListItem(service) {
    const link = createElement('a', { className: 'list-group-item list-group-item-action d-flex gap-3 align-items-start', attributes: { href: serviceUrl(service.id) } });
    const text = createElement('span', { className: 'flex-grow-1' });
    text.append(createElement('span', { className: 'fw-semibold d-block', text: localized(service.title) }),
      createElement('span', { className: 'small text-body-secondary d-block', text: localized(service.shortDescription, '') }),
      createElement('span', { className: 'small text-body-secondary', text: servicePath(service) }));
    link.append(createElement('span', { text: safeIcon(service.icon) }), text); return link;
  }

  function childrenOf(parentId) { return state.tree.folders.filter((folder) => (folder.parentFolderId || null) === parentId).sort(byOrder); }
  function folderPath(folderId) {
    const path = [], visited = new Set(); let current = state.tree.folders.find((folder) => folder.id === folderId);
    while (current && !visited.has(current.id)) { visited.add(current.id); path.unshift(current); current = state.tree.folders.find((folder) => folder.id === current.parentFolderId); }
    return path;
  }
  function servicePath(service) { return folderPath(service.folderId).map((folder) => localized(folder.title)).join(' / '); }
}

function readViewMode() { try { return localStorage.getItem(VIEW_STORAGE_KEY) === 'list' ? 'list' : 'cards'; } catch { return 'cards'; } }
function localized(value, fallback = '—') { return typeof value === 'string' ? value : value?.[I18n.getLanguage()] || value?.ru || value?.en || fallback; }
function byOrder(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0) || localized(a.title).localeCompare(localized(b.title)); }
function serviceUrl(id) { return 'service-form.html?serviceId=' + encodeURIComponent(id); }
function safeIcon(icon) { return /^[a-z0-9-]{1,80}$/.test(icon || '') ? icon : '●'; }
