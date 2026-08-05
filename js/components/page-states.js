import { createElement } from './dom.js';

function createState(kind, title, message, action) {
  const wrapper = createElement('section', {
    className: 'app-state card border-0 shadow-sm',
    attributes: { 'data-state': kind, role: kind === 'error' ? 'alert' : 'status' }
  });
  const body = createElement('div', { className: 'app-state__body card-body' });
  body.append(
    createElement('h2', { className: 'h5', text: title }),
    createElement('p', { className: 'text-body-secondary mb-0', text: message })
  );
  if (action) body.append(action);
  wrapper.append(body);
  return wrapper;
}

export function createLoadingState(i18n, messageKey = 'states.loading') {
  const state = createState('loading', i18n.t('states.loadingTitle'), i18n.t(messageKey));
  const spinner = createElement('div', {
    className: 'spinner-border text-primary mb-3',
    attributes: { role: 'status', 'aria-label': i18n.t('states.loadingTitle') }
  });
  state.firstElementChild.prepend(spinner);
  return state;
}
export function createEmptyState(i18n, messageKey = 'states.empty') {
  return createState('empty', i18n.t('states.emptyTitle'), i18n.t(messageKey));
}
export function createErrorState(i18n, messageKey = 'states.error') {
  return createState('error', i18n.t('states.errorTitle'), i18n.t(messageKey));
}
export function createForbiddenState(i18n, messageKey = 'states.forbidden') {
  return createState('forbidden', i18n.t('states.forbiddenTitle'), i18n.t(messageKey));
}
