import { initializeProtectedPage } from '../app.js';
import { apiClient } from '../auth.js';
import { CatalogApi } from '../api/catalog-api.js';
import { DictionariesApi } from '../api/dictionaries-api.js';
import { FormsApi } from '../api/forms-api.js';
import { PAGE_ROLES } from '../core/permissions.js';
import { normalizeAvailability } from '../core/availability-matcher.js';
import { I18n } from '../i18n/index.js';
import { createElement } from '../components/dom.js';
import { createEmptyState, createErrorState, createLoadingState } from '../components/page-states.js';
import { FormSelector } from '../components/form-selector.js';
import { FormVersionSelector } from '../components/form-version-selector.js';
import { UserSelector } from '../components/user-selector.js';
import { GroupSelector } from '../components/group-selector.js';
import { DepartmentSelector } from '../components/department-selector.js';
import { OrganizationSelector } from '../components/organization-selector.js';
import { SlaPolicySelector } from '../components/sla-policy-selector.js';

const content = createElement('section', { className: 'catalog-editor-page' });
const page = await initializeProtectedPage({
  titleKey: 'pages.catalogEditor', activeNav: 'admin-catalog',
  requiredRoles: PAGE_ROLES.catalogEditor, content
});

if (page?.accessStatus === 'ready') {
  const catalogApi = new CatalogApi(apiClient);
  const dictionariesApi = new DictionariesApi(apiClient);
  const formsApi = new FormsApi(apiClient);
  let tree = { folders: [], services: [] };
  let dirty = false;
  let saving = false;
  addEventListener('beforeunload', (event) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });
  await loadTree();

  async function loadTree() {
    content.replaceChildren(createLoadingState(I18n));
    try {
      const result = await catalogApi.getTree({ includeArchived: true, includeDrafts: true });
      tree = { folders: result?.folders || [], services: result?.services || [] };
      renderWorkspace();
    } catch {
      const error = createErrorState(I18n, 'catalogEditor.loadError');
      const retry = button(I18n.t('common.retry'), 'btn btn-primary mt-3', loadTree);
      error.querySelector('.app-state__body').append(retry);
      content.replaceChildren(error);
    }
  }

  function renderWorkspace() {
    const root = createElement('div', { className: 'row g-3' });
    const treeColumn = createElement('div', { className: 'col-12 col-xl-5' });
    const editorColumn = createElement('div', { className: 'col-12 col-xl-7' });
    editorColumn.id = 'catalog-editor-panel';
    const card = createElement('div', { className: 'card border-0 shadow-sm' });
    const header = createElement('div', { className: 'card-header bg-body d-flex justify-content-between align-items-center' });
    header.append(createElement('h2', { className: 'h5 mb-0', text: I18n.t('catalogEditor.tree') }),
      button(I18n.t('catalogEditor.newRootFolder'), 'btn btn-primary btn-sm', () => openFolderEditor(null, null)));
    const body = createElement('div', { className: 'card-body catalog-tree' });
    renderTree(body);
    card.append(header, body);
    treeColumn.append(card);
    editorColumn.append(createEmptyState(I18n, 'catalogEditor.chooseItem'));
    root.append(treeColumn, editorColumn);
    content.replaceChildren(root);
  }

  function renderTree(target) {
    target.replaceChildren();
    const roots = tree.folders.filter((folder) => !folder.parentFolderId);
    roots.sort(byOrder).forEach((folder) => target.append(folderNode(folder)));
    tree.services.filter((service) => !service.folderId).sort(byOrder).forEach((service) => target.append(serviceNode(service)));
    if (!tree.folders.length && !tree.services.length) target.append(createEmptyState(I18n, 'catalogEditor.empty'));
  }

  function folderNode(folder) {
    const details = createElement('details', { className: 'catalog-node catalog-folder', attributes: { open: 'open' } });
    const summary = createElement('summary', { className: 'catalog-node__summary' });
    const title = createElement('span', { className: 'fw-semibold', text: localized(folder.title) });
    const actions = createElement('span', { className: 'catalog-node__actions' });
    actions.append(
      miniButton('+', I18n.t('catalogEditor.newSubfolder'), () => openFolderEditor(null, folder.id)),
      miniButton(I18n.t('common.edit'), I18n.t('common.edit'), () => openFolderEditor(folder)),
      miniButton('＋S', I18n.t('catalogEditor.newService'), () => openServiceEditor(null, folder.id)),
      miniButton('×', I18n.t('catalogEditor.deleteFolder'), () => deleteFolder(folder))
    );
    summary.append(title, actions);
    const children = createElement('div', { className: 'catalog-node__children' });
    tree.folders.filter((item) => item.parentFolderId === folder.id).sort(byOrder).forEach((item) => children.append(folderNode(item)));
    tree.services.filter((item) => item.folderId === folder.id).sort(byOrder).forEach((item) => children.append(serviceNode(item)));
    details.append(summary, children);
    return details;
  }

  function serviceNode(service) {
    const row = createElement('div', { className: 'catalog-service d-flex justify-content-between gap-2' });
    const open = button(localized(service.title), 'btn btn-link text-start p-0', () => openServiceEditor(service));
    const badge = createElement('span', { className: 'badge text-bg-secondary', text: service.status });
    row.append(open, badge);
    return row;
  }

  function openFolderEditor(folder, parentFolderId = null) {
    if (dirty) { page.toasts.show(I18n.t('catalogEditor.finishEditing'), 'warning'); return; }
    const panel = document.getElementById('catalog-editor-panel');
    const form = createElement('form', { className: 'card border-0 shadow-sm' });
    form.innerHTML = `<div class="card-header bg-body"><h2 class="h5 mb-0">${I18n.t(folder ? 'catalogEditor.editFolder' : 'catalogEditor.createFolder')}</h2></div>
      <div class="card-body row g-3">
        ${inputMarkup('titleRu', I18n.t('catalogEditor.titleRu'), 'text', true)}
        ${inputMarkup('titleEn', I18n.t('catalogEditor.titleEn'))}
        ${inputMarkup('sortOrder', I18n.t('catalogEditor.sortOrder'), 'number')}
      </div><div class="card-footer bg-body d-flex gap-2"><button class="btn btn-primary" type="submit">${I18n.t('common.save')}</button><button class="btn btn-outline-secondary cancel-editor" type="button">${I18n.t('common.cancel')}</button></div>`;
    form.elements.titleRu.value = localized(folder?.title, 'ru', '');
    form.elements.titleEn.value = localized(folder?.title, 'en', '');
    form.elements.sortOrder.value = folder?.sortOrder ?? 0;
    form.addEventListener('input', markDirty);
    form.querySelector('.cancel-editor').addEventListener('click', closeEditor);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const value = { title: { ru: valueOf(data, 'titleRu'), en: valueOf(data, 'titleEn') }, parentFolderId: folder?.parentFolderId ?? parentFolderId, sortOrder: numberOf(data, 'sortOrder') };
      await command(form.querySelector('[type=submit]'), async () => {
        if (folder) await catalogApi.updateFolder(folder.id, value, folder.version);
        else await catalogApi.createFolder(value);
        dirty = false;
        await loadTree();
      });
    });
    panel.replaceChildren(form);
  }

  async function openServiceEditor(summary, initialFolderId = null) {
    if (dirty) { page.toasts.show(I18n.t('catalogEditor.finishEditing'), 'warning'); return; }
    const panel = document.getElementById('catalog-editor-panel');
    panel.replaceChildren(createLoadingState(I18n));
    try {
      const service = summary?.id ? await catalogApi.getService(summary.id) : null;
      const originalStatus = service?.status || 'DRAFT';
      const originalAvailability = normalizeAvailability(service?.availability);
      const form = createElement('form', { className: 'card border-0 shadow-sm service-editor' });
      form.innerHTML = `<div class="card-header bg-body d-flex justify-content-between"><h2 class="h5 mb-0">${I18n.t(service ? 'catalogEditor.editService' : 'catalogEditor.createService')}</h2><span class="badge text-bg-secondary current-status"></span></div>
        <div class="card-body row g-3">
          ${inputMarkup('code', I18n.t('catalogEditor.code'), 'text', true)}
          ${inputMarkup('titleRu', I18n.t('catalogEditor.titleRu'), 'text', true)}
          ${inputMarkup('titleEn', I18n.t('catalogEditor.titleEn'))}
          ${inputMarkup('shortRu', I18n.t('catalogEditor.shortRu'))}
          ${inputMarkup('shortEn', I18n.t('catalogEditor.shortEn'))}
          ${inputMarkup('descriptionRu', I18n.t('catalogEditor.descriptionRu'))}
          ${inputMarkup('descriptionEn', I18n.t('catalogEditor.descriptionEn'))}
          ${inputMarkup('icon', I18n.t('catalogEditor.icon'))}
          ${inputMarkup('sortOrder', I18n.t('catalogEditor.sortOrder'), 'number')}
          ${selectMarkup('status', I18n.t('catalogEditor.status'), ['DRAFT','PUBLISHED','ARCHIVED'])}
          <div class="col-12 col-md-6" data-slot="form"></div><div class="col-12 col-md-6" data-slot="version"></div>
          <div class="col-12 col-md-6" data-slot="group"></div><div class="col-12 col-md-6" data-slot="assignee"></div>
          <div class="col-12 col-md-6" data-slot="sla"></div>
          ${selectMarkup('availabilityMode', I18n.t('catalogEditor.availability'), ['ALL','RESTRICTED'], originalAvailability.mode)}
          <div class="col-12 restricted-audience"><div class="row g-3"><div class="col-md-4" data-slot="users"></div><div class="col-md-4" data-slot="departments"></div><div class="col-md-4" data-slot="organizations"></div></div></div>
        </div><div class="card-footer bg-body d-flex flex-wrap gap-2"><button class="btn btn-primary" type="submit">${I18n.t('common.save')}</button><button class="btn btn-outline-secondary cancel-editor" type="button">${I18n.t('common.cancel')}</button></div>`;
      form.querySelector('.current-status').textContent = originalStatus;
      form.elements.code.value = service?.code || '';
      form.elements.titleRu.value = localized(service?.title, 'ru', '');
      form.elements.titleEn.value = localized(service?.title, 'en', '');
      form.elements.shortRu.value = localized(service?.shortDescription, 'ru', '');
      form.elements.shortEn.value = localized(service?.shortDescription, 'en', '');
      form.elements.descriptionRu.value = localized(service?.description, 'ru', '');
      form.elements.descriptionEn.value = localized(service?.description, 'en', '');
      form.elements.icon.value = service?.icon || '';
      form.elements.sortOrder.value = service?.sortOrder ?? 0;
      form.elements.status.value = originalStatus;
      const selectors = createSelectors(form);
      await Promise.all(Object.values(selectors).map((selector) => selector.load()));
      selectors.form.setValue(service?.formId);
      await selectors.version.load();
      selectors.version.setValue(service?.formVersionId);
      selectors.group.setValue(service?.responsibleGroupId);
      selectors.assignee.setValue(service?.defaultAssigneeId);
      selectors.sla.setValue(service?.slaPolicyId);
      selectors.users.setValue(originalAvailability.userIds);
      selectors.departments.setValue(originalAvailability.departmentIds);
      selectors.organizations.setValue(originalAvailability.organizationIds);
      toggleRestricted(form);
      form.addEventListener('input', (event) => {
        if (event.target.matches('.remote-selector input[type="search"]')) return;
        markDirty();
      });
      form.querySelector('.cancel-editor').addEventListener('click', closeEditor);
      form.addEventListener('change', (event) => {
        if (event.target.matches('.remote-selector input[type="search"]')) return;
        markDirty();
        if (event.target.name === 'availabilityMode') toggleRestricted(form);
      });
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        await saveService(form, selectors, service, initialFolderId, originalStatus, originalAvailability);
      });
      if (service) {
        const move = button(I18n.t('catalogEditor.move'), 'btn btn-outline-primary', () => showMoveModal(service));
        form.querySelector('.card-footer').append(move);
      }
      panel.replaceChildren(form);
    } catch {
      panel.replaceChildren(createErrorState(I18n, 'catalogEditor.itemLoadError'));
    }
  }

  function createSelectors(form) {
    const currentFormId = () => selectors.form.getValue();
    const selectors = {
      form: new FormSelector(formsApi, selectorOptions('catalogEditor.form')),
      version: new FormVersionSelector(formsApi, { ...selectorOptions('catalogEditor.formVersion'), getFormId: currentFormId }),
      group: new GroupSelector(dictionariesApi, selectorOptions('catalogEditor.group')),
      assignee: new UserSelector(dictionariesApi, selectorOptions('catalogEditor.assignee')),
      sla: new SlaPolicySelector(dictionariesApi, selectorOptions('catalogEditor.sla')),
      users: new UserSelector(dictionariesApi, { ...selectorOptions('catalogEditor.users'), multiple: true }),
      departments: new DepartmentSelector(dictionariesApi, { ...selectorOptions('catalogEditor.departments'), multiple: true }),
      organizations: new OrganizationSelector(dictionariesApi, { ...selectorOptions('catalogEditor.organizations'), multiple: true })
    };
    Object.entries(selectors).forEach(([name, selector]) => form.querySelector(`[data-slot="${name}"]`).append(labelWrap(selector.options.label, selector.element)));
    selectors.form.options.onChange = async () => { selectors.version.setValue(null); await selectors.version.load(); markDirty(); };
    selectors.form.select.addEventListener('change', selectors.form.options.onChange);
    return selectors;
  }

  async function saveService(formElement, selectors, service, initialFolderId, originalStatus, originalAvailability) {
    const data = new FormData(formElement);
    const status = valueOf(data, 'status');
    const availability = normalizeAvailability({
      mode: valueOf(data, 'availabilityMode'), userIds: selectors.users.getValue(),
      departmentIds: selectors.departments.getValue(), organizationIds: selectors.organizations.getValue()
    });
    const value = {
      code: valueOf(data, 'code'), title: { ru: valueOf(data, 'titleRu'), en: valueOf(data, 'titleEn') },
      shortDescription: { ru: valueOf(data, 'shortRu'), en: valueOf(data, 'shortEn') },
      description: { ru: valueOf(data, 'descriptionRu'), en: valueOf(data, 'descriptionEn') }, icon: valueOf(data, 'icon') || null,
      folderId: service?.folderId ?? initialFolderId, formId: selectors.form.getValue(), formVersionId: selectors.version.getValue(),
      responsibleGroupId: selectors.group.getValue(), defaultAssigneeId: selectors.assignee.getValue(),
      slaPolicyId: selectors.sla.getValue(), sortOrder: numberOf(data, 'sortOrder'), status, availability
    };
    await command(formElement.querySelector('[type=submit]'), async () => {
      if (!service) await catalogApi.createService(value);
      else {
        const { status: ignoredStatus, availability: ignoredAvailability, ...changes } = value;
        let updated = await catalogApi.updateService(service.id, changes, service.version);
        if (JSON.stringify(availability) !== JSON.stringify(originalAvailability)) {
          updated = await catalogApi.updateServiceAvailability(service.id, availability, updated.version);
        }
        if (status !== originalStatus) await catalogApi.changeServiceStatus(service.id, status, updated.version);
      }
      dirty = false;
      await loadTree();
    });
  }

  async function deleteFolder(folder) {
    const hasChildren = tree.folders.some((item) => item.parentFolderId === folder.id)
      || tree.services.some((item) => item.folderId === folder.id);
    if (hasChildren) { page.toasts.show(I18n.t('catalogEditor.folderNotEmpty'), 'warning'); return; }
    page.modal.show({ title: I18n.t('catalogEditor.deleteFolder'), body: I18n.t('catalogEditor.deleteConfirm'), confirmText: I18n.t('catalogEditor.deleteFolder'), onConfirm: async () => {
      try { await catalogApi.deleteFolder(folder.id, folder.version); await loadTree(); }
      catch (error) { showCommandError(error); }
    } });
  }

  function showMoveModal(service) {
    if (dirty) {
      page.toasts.show(I18n.t('catalogEditor.saveBeforeMove'), 'warning');
      return;
    }
    const select = createElement('select', { className: 'form-select' });
    tree.folders.sort(byOrder).forEach((folder) => select.append(createElement('option', { text: localized(folder.title), attributes: { value: folder.id } })));
    const host = createMoveModal(select, async () => {
      try { await catalogApi.moveService(service.id, select.value, service.version); dirty = false; host.hide(); await loadTree(); }
      catch (error) { showCommandError(error); }
    });
    host.show();
  }

  async function command(buttonElement, operation) {
    if (saving) return;
    saving = true; buttonElement.disabled = true;
    try { await operation(); }
    catch (error) { showCommandError(error); }
    finally { saving = false; buttonElement.disabled = false; }
  }

  function showCommandError(error) {
    page.toasts.show(I18n.t(error?.code === 'VERSION_CONFLICT' ? 'catalogEditor.versionConflict' : 'catalogEditor.commandError'), 'danger');
  }

  function toggleRestricted(form) {
    form.querySelector('.restricted-audience').classList.toggle('d-none', form.elements.availabilityMode.value !== 'RESTRICTED');
  }

  function closeEditor() {
    dirty = false;
    document.getElementById('catalog-editor-panel').replaceChildren(createEmptyState(I18n, 'catalogEditor.chooseItem'));
  }

  function markDirty() { dirty = true; }
}

function createMoveModal(select, onConfirm) {
  const element = createElement('div', { className: 'modal fade', attributes: { tabindex: '-1', 'aria-hidden': 'true' } });
  element.innerHTML = `<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h2 class="modal-title fs-5">${I18n.t('catalogEditor.move')}</h2><button class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"></div><div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">${I18n.t('common.cancel')}</button><button class="btn btn-primary confirm">${I18n.t('catalogEditor.move')}</button></div></div></div>`;
  element.querySelector('.modal-body').append(select);
  document.body.append(element);
  const instance = globalThis.bootstrap.Modal.getOrCreateInstance(element);
  element.querySelector('.confirm').addEventListener('click', onConfirm);
  element.addEventListener('hidden.bs.modal', () => element.remove(), { once: true });
  return instance;
}

function selectorOptions(key) { return { label: I18n.t(key), emptyLabel: I18n.t('catalogEditor.notSelected') }; }
function labelWrap(label, element) { const wrap = createElement('div'); wrap.append(createElement('label', { className: 'form-label', text: label }), element); return wrap; }
function button(text, className, handler) { const value = createElement('button', { className, text, attributes: { type: 'button' } }); value.addEventListener('click', handler); return value; }
function miniButton(text, label, handler) { const value = button(text, 'btn btn-sm btn-outline-secondary', (event) => { event.preventDefault(); event.stopPropagation(); handler(); }); value.setAttribute('aria-label', label); value.title = label; return value; }
function valueOf(data, name) { return String(data.get(name) || '').trim(); }
function numberOf(data, name) { const value = Number(data.get(name)); return Number.isFinite(value) ? Math.trunc(value) : 0; }
function localized(value, language = I18n.getLanguage(), fallback = '—') { return typeof value === 'string' ? value : value?.[language] || value?.ru || value?.en || fallback; }
function byOrder(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0) || localized(a.title).localeCompare(localized(b.title)); }
function inputMarkup(name, label, type = 'text', required = false) { return `<div class="col-12 col-md-6"><label class="form-label">${label}</label><input class="form-control" name="${name}" type="${type}"${required ? ' required' : ''}></div>`; }
function selectMarkup(name, label, values) { return `<div class="col-12 col-md-6"><label class="form-label">${label}</label><select class="form-select" name="${name}">${values.map((value) => `<option value="${value}">${value}</option>`).join('')}</select></div>`; }
