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

export function createLoadingState(message = 'Загрузка…') {
  const state = createState('loading', 'Загрузка', message);
  const spinner = createElement('div', {
    className: 'spinner-border text-primary mb-3',
    attributes: { role: 'status', 'aria-label': 'Загрузка' }
  });
  state.firstElementChild.prepend(spinner);
  return state;
}
export function createEmptyState(message = 'Здесь пока ничего нет.') {
  return createState('empty', 'Нет данных', message);
}
export function createErrorState(message = 'Не удалось загрузить данные.') {
  return createState('error', 'Произошла ошибка', message);
}
export function createForbiddenState(message = 'У вас нет доступа к этому разделу.') {
  return createState('forbidden', 'Доступ запрещён', message);
}
