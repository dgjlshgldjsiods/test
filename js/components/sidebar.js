import { createElement } from './dom.js';
import { canAccessAdminSection } from '../core/permissions.js';

export function createSidebar(activeNav, user, i18n) {
  const aside = createElement('aside', { className: 'app-sidebar' });
  const nav = createElement('nav', { className: 'nav nav-pills flex-column gap-1', attributes: { 'aria-label': i18n.t('nav.main') } });

  appendLink(nav, 'catalog', i18n.t('nav.catalog'), 'service-catalog.html', activeNav);
  appendLink(nav, 'requests', i18n.t('nav.requests'), 'requests.html', activeNav);
  appendLink(nav, 'profile', i18n.t('nav.profile'), 'profile.html', activeNav);

  const hasCatalogAdmin = canAccessAdminSection(user, 'catalogEditor');
  const hasFormAdmin = canAccessAdminSection(user, 'forms');
  const hasSlaAdmin = canAccessAdminSection(user, 'slaEditor');
  if (hasCatalogAdmin || hasFormAdmin || hasSlaAdmin) {
    nav.append(createElement('hr'));
    if (hasCatalogAdmin) appendLink(nav, 'admin-catalog', i18n.t('nav.catalogEditor'), 'admin/catalog-editor.html', activeNav);
    if (hasFormAdmin) appendLink(nav, 'admin-forms', i18n.t('nav.forms'), 'admin/forms.html', activeNav);
    if (hasSlaAdmin) appendLink(nav, 'admin-sla', i18n.t('nav.sla'), 'admin/sla-editor.html', activeNav);
  }

  aside.append(nav);
  return aside;
}

function appendLink(nav, key, label, path, activeNav) {
  const link = createElement('a', {
    className: 'nav-link' + (key === activeNav ? ' active' : ''),
    text: label,
    attributes: {
      href: resolveLink(path),
      'aria-current': key === activeNav ? 'page' : 'false'
    }
  });
  nav.append(link);
}

function resolveLink(path) {
  const inAdmin = window.location.pathname.includes('/admin/');
  if (inAdmin && path.startsWith('admin/')) return path.slice(6);
  if (inAdmin) return '../' + path;
  return path;
}
