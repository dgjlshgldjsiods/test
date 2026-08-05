import { createElement } from './dom.js';

export function createNavbar() {
  const nav = createElement('nav', { className: 'navbar navbar-expand-lg bg-body border-bottom sticky-top' });
  const container = createElement('div', { className: 'container-fluid' });
  const brand = createElement('a', { className: 'navbar-brand fw-semibold', text: 'ITSM', attributes: { href: resolveLink('service-catalog.html') } });
  const badge = createElement('span', { className: 'badge text-bg-secondary', text: 'Прототип' });
  container.append(brand, badge);
  nav.append(container);
  return nav;
}

function resolveLink(path) {
  return window.location.pathname.includes('/admin/') ? '../' + path : path;
}
