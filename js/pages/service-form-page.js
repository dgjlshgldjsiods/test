import { initializeProtectedPage } from '../app.js';
import { apiClient } from '../auth.js';
import { CatalogApi } from '../api/catalog-api.js';
import { FormsApi } from '../api/forms-api.js';
import { RequestsApi } from '../api/requests-api.js';
import { DictionariesApi } from '../api/dictionaries-api.js';
import { I18n } from '../i18n/index.js';
import { createElement } from '../components/dom.js';
import { createErrorState, createLoadingState } from '../components/page-states.js';
import { validateAndCloneSurveySchema } from '../core/safe-survey-schema.js';
import { SurveyDictionaryLoader } from '../components/survey-dictionary-loader.js';

const content = createElement('section', { className: 'service-form-page' });
const page = await initializeProtectedPage({
  titleKey: 'pages.serviceForm', activeNav: 'catalog', content
});

if (page?.accessStatus === 'ready') {
  const serviceId = new URLSearchParams(location.search).get('serviceId');
  const catalogApi = new CatalogApi(apiClient);
  const formsApi = new FormsApi(apiClient);
  const requestsApi = new RequestsApi(apiClient);
  const dictionaryLoader = new SurveyDictionaryLoader(new DictionariesApi(apiClient));
  let submitting = false;

  if (!serviceId) renderFatal('serviceForm.missingService');
  else await loadForm();

  async function loadForm() {
    content.replaceChildren(createLoadingState(I18n));
    try {
      const service = await catalogApi.getAvailableService(serviceId);
      if (!service || service.status !== 'PUBLISHED') {
        renderFatal('serviceForm.unavailable');
        return;
      }
      if (!service.formId || !service.formVersionId) {
        renderFatal('serviceForm.formNotConfigured');
        return;
      }
      const version = await formsApi.getPublishedVersion(service.formVersionId, service.id);
      if (!version || version.status !== 'PUBLISHED' || version.formId !== service.formId) {
        renderFatal('serviceForm.formUnavailable');
        return;
      }
      const schema = validateAndCloneSurveySchema(version.schema);
      await renderSurvey(service, version, schema);
    } catch (error) {
      const key = error?.name === 'SurveySchemaError' ? 'serviceForm.unsafeSchema' : 'serviceForm.loadError';
      const state = createErrorState(I18n, key);
      const retry = createElement('button', { className: 'btn btn-primary mt-3', text: I18n.t('common.retry'), attributes: { type: 'button' } });
      retry.addEventListener('click', loadForm);
      state.querySelector('.app-state__body').append(retry);
      content.replaceChildren(state);
    }
  }

  async function renderSurvey(service, version, schema) {
    if (!globalThis.Survey?.Model) throw new Error('SURVEY_LIBRARY_UNAVAILABLE');
    const root = createElement('div');
    const heading = createElement('div', { className: 'card border-0 shadow-sm mb-3' });
    const headingBody = createElement('div', { className: 'card-body' });
    headingBody.append(createElement('h1', { className: 'h3', text: localized(service.title) }),
      createElement('p', { className: 'text-body-secondary mb-0', text: localized(service.description, '') }));
    heading.append(headingBody);

    const surveyHost = createElement('div', { className: 'card border-0 shadow-sm service-survey-host' });
    const surveyBody = createElement('div', { className: 'card-body' });
    const surveyContainer = createElement('div', { attributes: { 'aria-label': I18n.t('serviceForm.form') } });
    surveyBody.append(surveyContainer);
    surveyHost.append(surveyBody);

    const attachment = createAttachmentAdapterState();
    const footer = createElement('div', { className: 'd-flex flex-column align-items-start mt-3 gap-2' });
    const submit = createElement('button', { className: 'btn btn-primary btn-lg', text: I18n.t('serviceForm.submit'), attributes: { type: 'button' } });
    const validationMessage = createElement('div', { className: 'text-danger d-none', attributes: { role: 'alert' } });
    footer.append(submit, validationMessage);
    root.append(heading, surveyHost, attachment, footer);
    content.replaceChildren(root);

    const model = new globalThis.Survey.Model(schema);
    model.locale = I18n.getLanguage();
    model.showCompleteButton = false;
    model.showCompletedPage = false;
    await dictionaryLoader.hydrate(model, schema);
    model.render(surveyContainer);

    submit.addEventListener('click', async () => {
      if (submitting) return;
      validationMessage.classList.add('d-none');
      const valid = typeof model.validate === 'function' ? model.validate() : !model.hasErrors?.();
      if (!valid) {
        validationMessage.textContent = I18n.t('serviceForm.validationError');
        validationMessage.classList.remove('d-none');
        return;
      }
      submitting = true;
      submit.disabled = true;
      submit.textContent = I18n.t('serviceForm.submitting');
      try {
        const request = await requestsApi.create({
          serviceId: service.id,
          formId: service.formId,
          formVersionId: version.id,
          fieldValues: { ...model.data },
          attachmentIds: []
        });
        const requestId = request?.id || request?.entityId;
        if (!requestId) throw new Error('REQUEST_ID_MISSING');
        location.replace('request-card.html?id=' + encodeURIComponent(requestId));
      } catch (error) {
        validationMessage.textContent = error?.code === 'VALIDATION_ERROR'
          ? I18n.t('serviceForm.serverValidationError')
          : I18n.t('serviceForm.submitError');
        validationMessage.classList.remove('d-none');
        submitting = false;
        submit.disabled = false;
        submit.textContent = I18n.t('serviceForm.submit');
      }
    });
  }

  function createAttachmentAdapterState() {
    const card = createElement('section', { className: 'card border-0 shadow-sm mt-3' });
    const body = createElement('div', { className: 'card-body' });
    body.append(createElement('h2', { className: 'h5', text: I18n.t('serviceForm.attachments') }),
      createElement('p', { className: 'text-body-secondary mb-2', text: I18n.t('serviceForm.attachmentsUnavailable') }),
      createElement('button', { className: 'btn btn-outline-secondary', text: I18n.t('serviceForm.chooseFiles'), attributes: { type: 'button', disabled: 'disabled' } }));
    card.append(body);
    return card;
  }

  function renderFatal(key) { content.replaceChildren(createErrorState(I18n, key)); }
}

function localized(value, fallback = '—') {
  if (typeof value === 'string') return value;
  return value?.[I18n.getLanguage()] || value?.ru || value?.en || fallback;
}
