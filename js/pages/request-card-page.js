import { initializeProtectedPage } from '../app.js';
import { apiClient, authSession } from '../auth.js';
import { RequestsApi } from '../api/requests-api.js';
import { FormsApi } from '../api/forms-api.js';
import { DictionariesApi } from '../api/dictionaries-api.js';
import { PAGE_ROLES, ROLES, hasRole } from '../core/permissions.js';
import { validateAndCloneSurveySchema } from '../core/safe-survey-schema.js';
import { I18n } from '../i18n/index.js';
import { createElement } from '../components/dom.js';
import { createErrorState, createForbiddenState, createLoadingState } from '../components/page-states.js';
import { SurveyDictionaryLoader } from '../components/survey-dictionary-loader.js';
import { RequestComments } from '../components/request-comments.js';
import { RequestHistory } from '../components/request-history.js';
import { RequestAssignment } from '../components/request-assignment.js';
import { createRequestSla } from '../components/request-sla.js';

const content = createElement('section', { className: 'request-card-page' });
const page = await initializeProtectedPage({
  titleKey: 'pages.requestCard', activeNav: 'requests', requiredRoles: PAGE_ROLES.requests, content
});

if (page?.accessStatus === 'ready') {
  const entityId = new URLSearchParams(location.search).get('id');
  const requestsApi = new RequestsApi(apiClient);
  const formsApi = new FormsApi(apiClient);
  const dictionariesApi = new DictionariesApi(apiClient);
  const dictionaryLoader = new SurveyDictionaryLoader(dictionariesApi);
  const currentUser = authSession.getCurrentUser();
  const canProcess = hasRole(currentUser, ROLES.OPERATOR);
  let request;

  if (!entityId) renderFatal('requestCard.missingId');
  else await loadCard();

  async function loadCard() {
    content.replaceChildren(createLoadingState(I18n));
    try {
      const [details, attachments, sla] = await Promise.all([
        requestsApi.get(entityId), requestsApi.getAttachments(entityId), requestsApi.getSla(entityId)
      ]);
      request = details?.request || details;
      if (!request?.formVersionId || !Number.isInteger(Number(request.version))) throw new Error('INVALID_REQUEST_DTO');
      const formVersion = await formsApi.getRequestVersion(request.formVersionId, entityId);
      if (!formVersion || formVersion.id !== request.formVersionId) throw new Error('FORM_VERSION_MISMATCH');
      await renderCard(details, formVersion, attachments, sla);
    } catch (error) {
      if (error?.code === 'FORBIDDEN' || error?.code === 'NOT_FOUND') content.replaceChildren(createForbiddenState(I18n));
      else renderFatal(error?.name === 'SurveySchemaError' ? 'serviceForm.unsafeSchema' : 'requestCard.loadError', true);
    }
  }

  async function renderCard(details, formVersion, attachments, sla) {
    const root = createElement('div', { className: 'row g-3' });
    const main = createElement('div', { className: 'col-12 col-xl-8 vstack gap-3' });
    const aside = createElement('aside', { className: 'col-12 col-xl-4 vstack gap-3' });
    main.append(createOverview(details), await createReadonlyForm(formVersion, request.fieldValues || {}));

    const comments = new RequestComments({
      i18n: I18n, canAddInternal: canProcess,
      onLoad: (query) => requestsApi.getComments(entityId, query),
      onAdd: async ({ type, text }) => {
        const result = await requestsApi.addComment(entityId, type, text, Number(request.version));
        request = result?.request || { ...request, version: result?.version ?? request.version + 1 };
      }
    });
    const history = new RequestHistory({ i18n: I18n, onLoad: (query) => requestsApi.getHistory(entityId, query) });
    main.append(comments.element, history.element);

    aside.append(createRequestSla(sla?.sla || sla || request.sla, I18n));
    if (canProcess) {
      aside.prepend(createStatusPanel(), createAssignmentPanel());
    }
    aside.append(createAttachments(attachments?.items || attachments || []));
    root.append(main, aside); content.replaceChildren(root);
    await Promise.all([comments.load(), history.load()]);
  }

  function createOverview(details) {
    const card = createElement('section', { className: 'card border-0 shadow-sm' });
    const body = createElement('div', { className: 'card-body' });
    const title = createElement('div', { className: 'd-flex flex-wrap justify-content-between gap-2' });
    title.append(createElement('h2', { className: 'h4 mb-0', text: `${request.number || entityId} · ${request.title || '—'}` }), statusBadge(request.status));
    const grid = createElement('dl', { className: 'row mt-3 mb-0' });
    const service = details?.service || request.service;
    addDefinition(grid, I18n.t('requestCard.service'), localized(service?.title || request.serviceTitle));
    addDefinition(grid, I18n.t('requestCard.author'), request.authorTitle || request.author?.title || '—');
    addDefinition(grid, I18n.t('requestCard.requestedFor'), request.requestedForTitle || request.requestedFor?.title || '—');
    addDefinition(grid, I18n.t('requestCard.createdAt'), formatDate(request.createdAt));
    addDefinition(grid, I18n.t('requestCard.group'), request.responsibleGroupTitle || request.responsibleGroup?.title || '—');
    addDefinition(grid, I18n.t('requestCard.assignee'), request.assigneeTitle || request.assignee?.title || '—');
    body.append(title, grid); card.append(body); return card;
  }

  async function createReadonlyForm(version, values) {
    if (!globalThis.Survey?.Model) throw new Error('SURVEY_LIBRARY_UNAVAILABLE');
    const schema = validateAndCloneSurveySchema(version.schema);
    const card = createElement('section', { className: 'card border-0 shadow-sm request-readonly-form' });
    const body = createElement('div', { className: 'card-body' });
    body.append(createElement('h2', { className: 'h5', text: I18n.t('requestCard.submittedForm') }));
    const host = createElement('div', { attributes: { 'aria-label': I18n.t('requestCard.submittedForm') } });
    body.append(host); card.append(body);
    const model = new globalThis.Survey.Model(schema);
    model.locale = I18n.getLanguage(); model.data = cloneJson(values); model.mode = 'display';
    model.showCompleteButton = false; model.showCompletedPage = false;
    await dictionaryLoader.hydrate(model, schema);
    model.render(host);
    return card;
  }

  function createStatusPanel() {
    const card = createElement('section', { className: 'card border-0 shadow-sm' });
    const body = createElement('div', { className: 'card-body' });
    body.append(createElement('h2', { className: 'h5', text: I18n.t('requestCard.changeStatus') }));
    const select = createElement('select', { className: 'form-select' });
    ['NEW', 'REGISTERED', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED', 'CANCELLED'].forEach((value) => {
      const item = createElement('option', { text: I18n.t(`requests.status.${value}`), attributes: { value } }); item.selected = value === request.status; select.append(item);
    });
    const comment = createElement('input', { className: 'form-control mt-2', attributes: { placeholder: I18n.t('requestCard.statusComment'), maxlength: '1000' } });
    const save = createElement('button', { className: 'btn btn-primary mt-2', text: I18n.t('common.save'), attributes: { type: 'button' } });
    const message = createElement('div', { className: 'small mt-2', attributes: { role: 'alert' } });
    save.addEventListener('click', () => runMutation(save, message, () => requestsApi.changeStatus(entityId, select.value, Number(request.version), comment.value.trim())).catch(() => {}));
    body.append(select, comment, save, message); card.append(body); return card;
  }

  function createAssignmentPanel() {
    const component = new RequestAssignment({
      i18n: I18n, dictionariesApi,
      onSave: ({ responsibleGroupId, assigneeId }) => runMutation(null, null, () => requestsApi.changeAssignment(entityId, responsibleGroupId, assigneeId, Number(request.version)))
    });
    component.setRequest(request).catch(() => { component.message.className = 'small text-danger mt-2'; component.message.textContent = I18n.t('requestCard.assignmentLoadError'); });
    return component.element;
  }

  async function runMutation(button, message, operation) {
    if (button) button.disabled = true;
    if (message) message.textContent = '';
    try { await operation(); await loadCard(); }
    catch (error) {
      if (message) { message.className = 'small text-danger mt-2'; message.textContent = error?.code === 'VERSION_CONFLICT' ? I18n.t('requestCard.versionConflict') : I18n.t('requestCard.commandError'); }
      throw error;
    } finally { if (button?.isConnected) button.disabled = false; }
  }

  function createAttachments(items) {
    const card = createElement('section', { className: 'card border-0 shadow-sm' });
    const body = createElement('div', { className: 'card-body' });
    body.append(createElement('h2', { className: 'h5', text: I18n.t('requestCard.attachments') }));
    const list = createElement('ul', { className: 'list-group list-group-flush' });
    if (!items.length) list.append(createElement('li', { className: 'list-group-item px-0 text-body-secondary', text: I18n.t('requestCard.noAttachments') }));
    items.forEach((item) => list.append(createElement('li', { className: 'list-group-item px-0', text: `${item.originalName || item.safeName || '—'} · ${formatBytes(item.size)}` })));
    body.append(list, createElement('p', { className: 'small text-body-secondary mb-0 mt-2', text: I18n.t('requestCard.attachmentReadOnly') })); card.append(body); return card;
  }

  function renderFatal(key, retry = false) {
    const state = createErrorState(I18n, key);
    if (retry) { const button = createElement('button', { className: 'btn btn-primary mt-3', text: I18n.t('common.retry'), attributes: { type: 'button' } }); button.addEventListener('click', loadCard); state.querySelector('.app-state__body').append(button); }
    content.replaceChildren(state);
  }
}

function addDefinition(root, term, value) { root.append(createElement('dt', { className: 'col-sm-4', text: term }), createElement('dd', { className: 'col-sm-8', text: value || '—' })); }
function statusBadge(status) { return createElement('span', { className: 'badge text-bg-secondary align-self-start', text: I18n.t(`requests.status.${status || 'UNKNOWN'}`) }); }
function localized(value) { return typeof value === 'string' ? value : value?.[I18n.getLanguage()] || value?.ru || value?.en || '—'; }
function formatDate(value) { const date = new Date(value); return value && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(I18n.getLanguage(), { dateStyle: 'medium', timeStyle: 'short' }).format(date) : '—'; }
function formatBytes(value) { const size = Number(value); return value !== null && value !== undefined && Number.isFinite(size) ? `${Math.ceil(size / 1024)} KB` : '—'; }
function cloneJson(value) { return JSON.parse(JSON.stringify(value)); }
