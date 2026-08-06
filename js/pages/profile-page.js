import { initializeProtectedPage } from '../app.js';
import { apiClient, authSession } from '../auth.js';
import { UsersApi } from '../api/users-api.js';
import { RequestsApi } from '../api/requests-api.js';
import { DictionariesApi } from '../api/dictionaries-api.js';
import { ROLES, hasRole } from '../core/permissions.js';
import { I18n } from '../i18n/index.js';
import { createElement } from '../components/dom.js';
import { createErrorState, createForbiddenState, createLoadingState } from '../components/page-states.js';
import { OrganizationSelector } from '../components/organization-selector.js';
import { DepartmentSelector } from '../components/department-selector.js';
import { GroupSelector } from '../components/group-selector.js';
import { ProfileRequestList } from '../components/profile-request-list.js';

const content = createElement('section', { className: 'profile-page' });
const page = await initializeProtectedPage({
  titleKey: 'pages.profile', activeNav: 'profile', content
});

if (page?.accessStatus === 'ready') {
  const currentUser = authSession.getCurrentUser();
  const queryId = new URLSearchParams(location.search).get('id');
  const targetId = queryId || currentUser?.id;
  const isSelf = targetId === currentUser?.id;
  const isSystemAdmin = hasRole(currentUser, ROLES.SYSTEM_ADMIN);
  const usersApi = new UsersApi(apiClient);
  const requestsApi = new RequestsApi(apiClient);
  const dictionariesApi = new DictionariesApi(apiClient);
  let profile;

  if (!targetId) renderError('profile.missingUser');
  else if (!isSelf && !isSystemAdmin) content.replaceChildren(createForbiddenState(I18n));
  else await loadProfile();

  async function loadProfile() {
    content.replaceChildren(createLoadingState(I18n));
    try {
      profile = await usersApi.get(isSelf && !queryId ? null : targetId);
      if (!profile?.id || !Number.isInteger(Number(profile.version))) throw new Error('INVALID_USER_DTO');
      await renderProfile();
    } catch (error) {
      if (error?.code === 'FORBIDDEN' || error?.code === 'NOT_FOUND') content.replaceChildren(createForbiddenState(I18n));
      else renderError('profile.loadError', true);
    }
  }

  async function renderProfile() {
    const root = createElement('div', { className: 'vstack gap-3' });
    const top = createElement('div', { className: 'row g-3' });
    top.append(createDetails(), await createEditor());
    const lists = createElement('div', { className: 'row g-3' });
    const created = requestList('profile.createdRequests', (request) => requestsApi.getUserCreated(profile.id, request));
    const assigned = requestList('profile.assignedRequests', (request) => requestsApi.getUserAssigned(profile.id, request));
    const groups = requestList('profile.groupRequests', (request) => requestsApi.getUserGroup(profile.id, request));
    [created, assigned, groups].forEach((component) => { const col = createElement('div', { className: 'col-12' }); col.append(component.element); lists.append(col); });
    root.append(top, lists); content.replaceChildren(root);
    await Promise.all([created.load(), assigned.load(), groups.load()]);
  }

  function createDetails() {
    const col = createElement('div', { className: 'col-12 col-xl-7' });
    const card = createElement('section', { className: 'card border-0 shadow-sm h-100' });
    const body = createElement('div', { className: 'card-body' });
    body.append(createElement('h2', { className: 'h4', text: profile.title || profile.login || profile.id }));
    const details = createElement('dl', { className: 'row mb-0' });
    add(details, I18n.t('profile.login'), profile.login);
    add(details, I18n.t('profile.fullName'), profile.title);
    add(details, I18n.t('profile.email'), profile.email);
    add(details, I18n.t('profile.phone'), profile.phone);
    add(details, I18n.t('profile.organizations'), refs(profile.organizations, profile.organizationIds));
    add(details, I18n.t('profile.department'), ref(profile.department, profile.departmentId));
    add(details, I18n.t('profile.groups'), refs(profile.groups, profile.groupIds));
    add(details, I18n.t('profile.roles'), (profile.roles || []).map(roleTitle).join(', '));
    add(details, I18n.t('profile.language'), profile.language || '—');
    add(details, I18n.t('profile.timezone'), profile.timezone || '—');
    add(details, I18n.t('profile.active'), profile.active === false ? I18n.t('common.no') : I18n.t('common.yes'));
    body.append(details); card.append(body); col.append(card); return col;
  }

  async function createEditor() {
    const col = createElement('div', { className: 'col-12 col-xl-5' });
    const card = createElement('section', { className: 'card border-0 shadow-sm h-100' });
    const body = createElement('div', { className: 'card-body' });
    body.append(createElement('h2', { className: 'h5', text: isSystemAdmin ? I18n.t('profile.adminEdit') : I18n.t('profile.preferences') }));
    const form = createElement('form');
    const language = select('language', I18n.t('profile.language'), [['ru', 'Русский'], ['en', 'English']], profile.language || I18n.getLanguage());
    const timezone = input('timezone', I18n.t('profile.timezone'), profile.timezone || 'UTC', 'text');
    form.append(language.wrap, timezone.wrap);
    let adminFields = null;
    if (isSystemAdmin) { adminFields = await createAdminFields(); form.prepend(...adminFields.elements); }
    const save = createElement('button', { className: 'btn btn-primary mt-3', text: I18n.t('common.save'), attributes: { type: 'submit' } });
    const message = createElement('div', { className: 'small mt-2', attributes: { role: 'alert' } });
    form.append(save, message);
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); save.disabled = true; message.textContent = '';
      const changes = { language: language.control.value, timezone: timezone.control.value.trim() };
      if (adminFields) Object.assign(changes, adminFields.getValue());
      try {
        const updated = await usersApi.update(profile.id, changes, Number(profile.version));
        if (isSelf) {
          authSession.updateCurrentUser({ ...currentUser, ...updated });
          I18n.setLanguage(updated.language || changes.language);
          location.reload();
          return;
        }
        profile = updated; await renderProfile();
      } catch (error) {
        message.className = 'small text-danger mt-2';
        message.textContent = error?.code === 'VERSION_CONFLICT' ? I18n.t('profile.versionConflict') : I18n.t('profile.saveError');
      } finally { if (save.isConnected) save.disabled = false; }
    });
    body.append(form); card.append(body); col.append(card); return col;
  }

  async function createAdminFields() {
    const title = input('title', I18n.t('profile.fullName'), profile.title || '');
    const email = input('email', I18n.t('profile.email'), profile.email || '', 'email');
    const phone = input('phone', I18n.t('profile.phone'), profile.phone || '', 'tel');
    const active = checkbox('active', I18n.t('profile.active'), profile.active !== false);
    const organizations = new OrganizationSelector(dictionariesApi, { label: I18n.t('profile.organizations'), multiple: true });
    const department = new DepartmentSelector(dictionariesApi, { label: I18n.t('profile.department') });
    const groups = new GroupSelector(dictionariesApi, { label: I18n.t('profile.groups'), multiple: true });
    await Promise.all([organizations.load(), department.load(), groups.load()]);
    ensureOptions(organizations.select, profile.organizations); ensureOptions(department.select, profile.department ? [profile.department] : []); ensureOptions(groups.select, profile.groups);
    organizations.setValue(profile.organizationIds || []); department.setValue(profile.departmentId); groups.setValue(profile.groupIds || []);
    const roles = createRoleSelect(profile.roles || []);
    return {
      elements: [title.wrap, email.wrap, phone.wrap, active.wrap, labeled(I18n.t('profile.organizations'), organizations.element), labeled(I18n.t('profile.department'), department.element), labeled(I18n.t('profile.groups'), groups.element), roles.wrap],
      getValue: () => ({
        title: title.control.value.trim(), email: email.control.value.trim() || null, phone: phone.control.value.trim() || null,
        active: active.control.checked, organizationIds: organizations.getValue(), departmentId: department.getValue(),
        groupIds: groups.getValue(), roles: Array.from(roles.control.selectedOptions, (item) => item.value)
      })
    };
  }

  function requestList(titleKey, load) { return new ProfileRequestList({ i18n: I18n, title: I18n.t(titleKey), load }); }
  function renderError(key, retry = false) { const state = createErrorState(I18n, key); if (retry) { const button = createElement('button', { className: 'btn btn-primary mt-3', text: I18n.t('common.retry'), attributes: { type: 'button' } }); button.addEventListener('click', loadProfile); state.querySelector('.app-state__body').append(button); } content.replaceChildren(state); }
}

function input(name, label, value, type = 'text') { const control = createElement('input', { className: 'form-control', attributes: { name, type, value, maxlength: '200' } }); return { control, wrap: labeled(label, control) }; }
function select(name, label, options, value) { const control = createElement('select', { className: 'form-select', attributes: { name } }); options.forEach(([id, title]) => { const item = createElement('option', { text: title, attributes: { value: id } }); item.selected = id === value; control.append(item); }); return { control, wrap: labeled(label, control) }; }
function checkbox(name, label, checked) { const control = createElement('input', { className: 'form-check-input', attributes: { name, type: 'checkbox', id: `profile-${name}` } }); control.checked = checked; const wrap = createElement('div', { className: 'form-check mt-3' }); wrap.append(control, createElement('label', { className: 'form-check-label', text: label, attributes: { for: `profile-${name}` } })); return { control, wrap }; }
function labeled(label, control) { const wrap = createElement('div', { className: 'mt-3' }); wrap.append(createElement('label', { className: 'form-label', text: label }), control); return wrap; }
function createRoleSelect(values) { const roles = Object.values(ROLES); const control = createElement('select', { className: 'form-select', attributes: { multiple: 'multiple', size: String(roles.length), name: 'roles' } }); roles.forEach((role) => { const item = createElement('option', { text: roleTitle(role), attributes: { value: role } }); item.selected = values.includes(role); control.append(item); }); return { control, wrap: labeled(I18n.t('profile.roles'), control) }; }
function add(root, term, value) { root.append(createElement('dt', { className: 'col-sm-4', text: term }), createElement('dd', { className: 'col-sm-8', text: value || '—' })); }
function refs(items, ids) { return Array.isArray(items) && items.length ? items.map((item) => item.title || item.name || item.id).join(', ') : (ids || []).join(', ') || '—'; }
function ref(item, id) { return item?.title || item?.name || item?.id || id || '—'; }
function ensureOptions(select, items = []) { (items || []).forEach((item) => { if (item?.id && !Array.from(select.options).some((option) => option.value === String(item.id))) select.append(createElement('option', { text: item.title || item.name || item.id, attributes: { value: item.id } })); }); }
function roleTitle(role) { return I18n.t(`profile.roleNames.${role}`); }
