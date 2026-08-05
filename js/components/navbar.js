import { createElement } from './dom.js';

export function createNavbar(user, onLogout) {
  const nav = createElement('nav', { className: 'navbar navbar-expand-lg bg-body border-bottom sticky-top' });
  const container = createElement('div', { className: 'container-fluid' });
  const brand = createElement('a', { className: 'navbar-brand fw-semibold', text: 'ITSM', attributes: { href: resolveLink('service-catalog.html') } });
  const actions = createElement('div', { className: 'd-flex align-items-center gap-3' });
  actions.append(createElement('span', {
    className: 'small text-body-secondary',
    text: user?.title || user?.login || 'Пользователь'
  }));
  if (onLogout) {
    const logoutButton = createElement('button', {
      className: 'btn btn-outline-secondary btn-sm',
      text: 'Выйти',
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

function resolveLink(path) {
  return window.location.pathname.includes('/admin/') ? '../' + path : path;
}
