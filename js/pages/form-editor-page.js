import { initializeProtectedPage } from '../app.js';
import { apiClient } from '../auth.js';
import { FormsApi } from '../api/forms-api.js';
import { PAGE_ROLES } from '../core/permissions.js';
import { I18n } from '../i18n/index.js';
import { createElement } from '../components/dom.js';
import { createErrorState, createLoadingState } from '../components/page-states.js';
import {
  cloneCommand, draftSaveCommand, hasActiveDraft, isEditableVersion,
  publishCommand, selectCurrentVersionId
} from '../core/form-versioning.js';

const content = createElement('section', { className: 'form-editor-page' });
const page = await initializeProtectedPage({
  titleKey: 'pages.formEditor', activeNav: 'admin-forms',
  requiredRoles: PAGE_ROLES.formEditor, content
});

if (page?.accessStatus === 'ready') {
  const api = new FormsApi(apiClient);
  const query = new URLSearchParams(location.search);
  const formId = query.get('formId');
  const view = query.get('view');
  const requestedVersionId = query.get('versionId');
  let dirty = false;
  let submitting = false;
  let form = null;
  let formVersion = null;
  let creator = null;

  addEventListener('beforeunload', warnAboutUnsavedChanges);

  if (query.get('mode') === 'create') await renderCreate();
  else if (!formId) renderFatal('formEditor.missingFormId');
  else if (view === 'history') await renderHistory();
  else await renderEditor(requestedVersionId);

  async function renderCreate() {
    content.replaceChildren(createLoadingState(I18n));
    try {
      creator = createSurveyCreator(true, {});
      const editor = createEditorShell({ creating: true });
      content.replaceChildren(editor.root);
      creator.render(editor.creatorHost);
      creator.onModified.add(markDirty);
      editor.metadata.querySelectorAll('input, textarea').forEach((field) => field.addEventListener('input', markDirty));
      editor.save.addEventListener('click', async () => {
        const metadata = readMetadata(editor.metadata);
        if (!metadata.code || !metadata.title.ru) {
          page.toasts.show(I18n.t('formEditor.metadataRequired'), 'danger');
          return;
        }
        await runCommand(editor.save, async () => {
          const result = await api.create(metadata, creator.JSON);
          clearDirty();
          const createdForm = result?.form;
          const draft = result?.draftVersion;
          location.replace('form-editor.html?formId=' + encodeURIComponent(createdForm.id)
            + '&versionId=' + encodeURIComponent(draft.id));
        });
      });
    } catch (error) {
      renderLoadError(error, renderCreate);
    }
  }

  async function renderEditor(versionId) {
    content.replaceChildren(createLoadingState(I18n));
    try {
      form = await api.get(formId);
      const targetVersionId = versionId || selectCurrentVersionId(form);
      if (!targetVersionId) throw new Error('FORM_VERSION_NOT_FOUND');
      formVersion = await api.getVersion(targetVersionId);
      const editable = isEditableVersion(form, formVersion);
      creator = createSurveyCreator(editable, formVersion.schema || {});
      const editor = createEditorShell({ editable, creating: false });
      fillMetadata(editor.metadata, form);
      setMetadataDisabled(editor.metadata, true);
      renderVersionBadge(editor.version, formVersion);
      content.replaceChildren(editor.root);
      creator.render(editor.creatorHost);

      if (editable) {
        creator.onModified.add(markDirty);
        editor.save.addEventListener('click', () => saveDraft(editor.save));
        editor.publish.addEventListener('click', () => page.modal.show({
          title: I18n.t('formEditor.publish'), body: I18n.t('formEditor.publishConfirm'),
          confirmText: I18n.t('formEditor.publish'), onConfirm: () => publish(editor.publish)
        }));
      } else {
        editor.clone.addEventListener('click', () => cloneFromVersion(editor.clone));
      }
    } catch (error) {
      renderLoadError(error, () => renderEditor(versionId));
    }
  }

  async function renderHistory() {
    content.replaceChildren(createLoadingState(I18n));
    try {
      const [loadedForm, result] = await Promise.all([
        api.get(formId), api.getVersions(formId, { page: 1, pageSize: 100 })
      ]);
      form = loadedForm;
      const root = createElement('div');
      const toolbar = createElement('div', { className: 'd-flex justify-content-between align-items-center mb-3' });
      toolbar.append(
        createElement('h2', { className: 'h5 mb-0', text: I18n.t('formEditor.historyTitle') }),
        linkButton(I18n.t('formEditor.backToEditor'), 'form-editor.html?formId=' + encodeURIComponent(formId))
      );
      const list = createElement('div', { className: 'list-group shadow-sm' });
      const items = Array.isArray(result?.items) ? result.items : [];
      items.forEach((version) => list.append(createVersionRow(version)));
      root.append(toolbar, items.length ? list : createElement('p', {
        className: 'text-body-secondary', text: I18n.t('formEditor.noVersions')
      }));
      content.replaceChildren(root);
    } catch (error) {
      renderLoadError(error, renderHistory);
    }
  }

  function createVersionRow(version) {
    const row = createElement('div', { className: 'list-group-item d-flex flex-column flex-lg-row gap-3 justify-content-between' });
    const info = createElement('div');
    info.append(
      createElement('div', { className: 'fw-semibold', text: I18n.t('formEditor.version', { number: version.versionNumber }) }),
      createElement('div', { className: 'small text-body-secondary', text: version.status + ' · ' + formatDate(version.updatedAt || version.createdAt) })
    );
    const actions = createElement('div', { className: 'd-flex gap-2 align-items-center' });
    actions.append(linkButton(I18n.t('formEditor.viewVersion'), 'form-editor.html?formId=' + encodeURIComponent(formId)
      + '&versionId=' + encodeURIComponent(version.id)));
    if (version.status !== 'DRAFT' && !hasActiveDraft(form)) {
      const clone = createElement('button', { className: 'btn btn-sm btn-primary', text: I18n.t('formEditor.createDraft'), attributes: { type: 'button' } });
      clone.addEventListener('click', () => cloneFromVersion(clone, version));
      actions.append(clone);
    }
    row.append(info, actions);
    return row;
  }

  async function saveDraft(button) {
    const command = draftSaveCommand(form, formVersion, creator.JSON);
    await runCommand(button, async () => {
      formVersion = await api.saveDraft(command.formId, command.formVersionId, command.schema, command.expectedVersion);
      clearDirty();
      page.toasts.show(I18n.t('formEditor.saved'), 'success');
    });
  }

  async function publish(button) {
    const command = publishCommand(form, formVersion);
    await runCommand(button, async () => {
      const result = await api.publishVersion(command.formId, command.formVersionId, command.expectedVersion);
      form = result.form;
      formVersion = result.publishedVersion;
      clearDirty();
      location.replace('form-editor.html?formId=' + encodeURIComponent(form.id) + '&versionId=' + encodeURIComponent(formVersion.id));
    });
  }

  async function cloneFromVersion(button, source = formVersion) {
    try {
      const command = cloneCommand(form, source);
      await runCommand(button, async () => {
        const draft = await api.cloneVersion(command.formId, command.sourceVersionId, command.expectedFormVersion);
        clearDirty();
        location.assign('form-editor.html?formId=' + encodeURIComponent(form.id) + '&versionId=' + encodeURIComponent(draft.id));
      });
    } catch (error) {
      if (error.message === 'ACTIVE_DRAFT_EXISTS') page.toasts.show(I18n.t('formEditor.activeDraftExists'), 'warning');
      else throw error;
    }
  }

  async function runCommand(button, operation) {
    if (submitting) return;
    submitting = true;
    button.disabled = true;
    try {
      await operation();
    } catch (error) {
      if (error?.code === 'VERSION_CONFLICT') {
        page.toasts.show(I18n.t('formEditor.versionConflict'), 'danger');
      } else {
        page.toasts.show(error?.message || I18n.t('formEditor.commandError'), 'danger');
      }
    } finally {
      submitting = false;
      button.disabled = false;
    }
  }

  function createEditorShell({ editable = true, creating = false }) {
    const root = createElement('div');
    const toolbar = createElement('div', { className: 'form-editor-toolbar card border-0 shadow-sm mb-3' });
    const body = createElement('div', { className: 'card-body d-flex flex-column flex-xl-row gap-3 justify-content-between' });
    const metadata = createMetadataForm();
    const buttons = createElement('div', { className: 'd-flex flex-wrap gap-2 align-items-start' });
    const version = createElement('span', { className: 'badge text-bg-secondary align-self-center' });
    const history = formId ? linkButton(I18n.t('formEditor.historyTitle'), 'form-editor.html?formId=' + encodeURIComponent(formId) + '&view=history') : null;
    const save = createElement('button', { className: 'btn btn-primary', text: I18n.t(creating ? 'formEditor.create' : 'formEditor.save'), attributes: { type: 'button' } });
    const publish = createElement('button', { className: 'btn btn-success', text: I18n.t('formEditor.publish'), attributes: { type: 'button' } });
    const clone = createElement('button', { className: 'btn btn-primary', text: I18n.t('formEditor.createDraft'), attributes: { type: 'button' } });
    if (!creating) buttons.append(version);
    if (history) buttons.append(history);
    if (creating || editable) buttons.append(save);
    if (!creating && editable) buttons.append(publish);
    if (!creating && !editable && !hasActiveDraft(form)) buttons.append(clone);
    if (!creating && !editable && hasActiveDraft(form)) {
      buttons.append(linkButton(I18n.t('formEditor.openDraft'), 'form-editor.html?formId=' + encodeURIComponent(formId)));
    }
    body.append(metadata, buttons);
    toolbar.append(body);
    const note = !creating && !editable
      ? createElement('div', {
        className: 'alert alert-info',
        text: I18n.t(hasActiveDraft(form) ? 'formEditor.readOnlyWithDraft' : 'formEditor.readOnly')
      }) : null;
    const creatorHost = createElement('div', { className: 'survey-creator-host border rounded', attributes: { 'aria-label': I18n.t('formEditor.creator') } });
    root.append(toolbar);
    if (note) root.append(note);
    root.append(creatorHost);
    return { root, metadata, version, save, publish, clone, creatorHost };
  }

  function createSurveyCreator(editable, schema) {
    if (!globalThis.SurveyCreator?.SurveyCreator) throw new Error(I18n.t('formEditor.creatorUnavailable'));
    const instance = new globalThis.SurveyCreator.SurveyCreator({
      showLogicTab: false, showTranslationTab: true, isAutoSave: false
    });
    instance.JSON = schema;
    instance.readOnly = !editable;
    return instance;
  }

  function createMetadataForm() {
    const wrapper = createElement('div', { className: 'row g-2 flex-grow-1' });
    wrapper.innerHTML = `
      <div class="col-12 col-md-3"><label class="form-label">${I18n.t('formEditor.code')}</label><input name="code" class="form-control" maxlength="100"></div>
      <div class="col-12 col-md-4"><label class="form-label">${I18n.t('formEditor.titleRu')}</label><input name="titleRu" class="form-control" maxlength="300"></div>
      <div class="col-12 col-md-4"><label class="form-label">${I18n.t('formEditor.titleEn')}</label><input name="titleEn" class="form-control" maxlength="300"></div>`;
    return wrapper;
  }

  function readMetadata(root) {
    return {
      code: root.querySelector('[name="code"]').value.trim(),
      title: {
        ru: root.querySelector('[name="titleRu"]').value.trim(),
        en: root.querySelector('[name="titleEn"]').value.trim()
      },
      description: { ru: '', en: '' }
    };
  }

  function fillMetadata(root, value) {
    root.querySelector('[name="code"]').value = value.code || '';
    root.querySelector('[name="titleRu"]').value = localized(value.title, 'ru');
    root.querySelector('[name="titleEn"]').value = localized(value.title, 'en');
  }

  function setMetadataDisabled(root, disabled) {
    root.querySelectorAll('input').forEach((input) => { input.disabled = disabled; });
  }

  function renderVersionBadge(target, version) {
    target.textContent = I18n.t('formEditor.versionStatus', { number: version.versionNumber, status: version.status });
  }

  function renderLoadError(error, retry) {
    const state = createErrorState(I18n, 'formEditor.loadError');
    const button = createElement('button', { className: 'btn btn-primary mt-3', text: I18n.t('common.retry'), attributes: { type: 'button' } });
    button.addEventListener('click', retry);
    state.querySelector('.app-state__body').append(button);
    content.replaceChildren(state);
    if (error?.message) console.warn('Form editor load failed', { code: error.code || error.name });
  }

  function renderFatal(key) {
    content.replaceChildren(createErrorState(I18n, key));
  }

  function markDirty() { dirty = true; }
  function clearDirty() { dirty = false; }
  function warnAboutUnsavedChanges(event) {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = '';
  }
}

function linkButton(text, href) {
  return createElement('a', { className: 'btn btn-outline-primary', text, attributes: { href } });
}

function localized(value, language) {
  if (typeof value === 'string') return value;
  return value?.[language] || '';
}

function formatDate(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(I18n.getLanguage(), { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
