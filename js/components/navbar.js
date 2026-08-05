import { createElement } from './dom.js';

export function createNavbar({ user, onLogout, i18n, theme }) {
  const nav = createElement('nav', { className: 'navbar navbar-expand-lg bg-body border-bottom sticky-top' });
  const container = createElement('div', { className: 'container-fluid' });
  const brand = createElement('a', { className: 'navbar-brand fw-semibold', text: i18n.t('common.appName'), attributes: { href: resolveLink('service-catalog.html') } });
  const actions = createElement('div', { className: 'd-flex flex-wrap align-items-center gap-2' });
  actions.append(createLanguageSelect(i18n), createThemeSelect(i18n, theme));
  actions.append(createElement('span', {
    className: 'small text-body-secondary',
    text: user?.title || user?.login || i18n.t('common.user')
  }));
  if (onLogout) {
    const logoutButton = createElement('button', {
      className: 'btn btn-outline-secondary btn-sm',
      text: i18n.t('common.logout'),
      attributes: { type: 'button' }
    });
    logoutButton.addEventListener('click', async () => {
      logoutButton.disabled = true;
      await onLogout();
    });
    actions.append(logoutButton);
  }
  container.append(brand, actions);
  nav.append(container);
  return nav;
}

function createLanguageSelect(i18n) {
  const select = createElement('select', {
    className: 'form-select form-select-sm w-auto',
    attributes: { 'aria-label': i18n.t('common.language') }
  });
  appendOption(select, 'ru', 'Русский');
  appendOption(select, 'en', 'English');
  select.value = i18n.getLanguage();
  select.addEventListener('change', () => {
    i18n.setLanguage(select.value);
    globalThis.location.reload();
  });
  return select;
}

function createThemeSelect(i18n, theme) {
  const select = createElement('select', {
    className: 'form-select form-select-sm w-auto',
    attributes: { 'aria-label': i18n.t('common.theme') }
  });
  appendOption(select, 'light', i18n.t('common.lightTheme'));
  appendOption(select, 'dark', i18n.t('common.darkTheme'));
  select.value = theme.getTheme();
  select.addEventListener('change', () => theme.setTheme(select.value));
  return select;
}

function appendOption(select, value, text) {
  const option = createElement('option', { text, attributes: { value } });
  select.append(option);
}

function resolveLink(path) {
  return window.location.pathname.includes('/admin/') ? '../' + path : path;
}
