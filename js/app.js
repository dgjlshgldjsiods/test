import { AppLayout } from './components/app-layout.js';
import { AppModal } from './components/modal.js';
import { ToastService } from './components/toast.js';
import { createErrorState, createForbiddenState, createLoadingState } from './components/page-states.js';
import { guardPage, logout } from './auth.js';
import { I18n } from './i18n/index.js';
import { Theme } from './core/theme.js';

export function initializePage(options) {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('App root element was not found');
  }

  I18n.applyDocumentLanguage();
  Theme.apply();
  const pageTitle = I18n.t(options.titleKey);
  document.title = pageTitle + ' — ' + I18n.t('common.appName');

  const modal = new AppModal(I18n);
  const toasts = new ToastService(I18n);
  const layout = new AppLayout(root, {
    title: pageTitle,
    activeNav: options.activeNav || '',
    content: options.content || I18n.t(options.contentKey || 'pages.stub'),
    user: options.user || null,
    onLogout: options.onLogout || null,
    i18n: I18n,
    theme: Theme
  });

  layout.render();
  modal.mount(document.body);
  toasts.mount(document.body);

  return Object.freeze({ layout, modal, toasts });
}

export async function initializeProtectedPage(options) {
  const root = document.getElementById('app');
  if (!root) throw new Error('App root element was not found');
  root.replaceChildren(createLoadingState(I18n, 'states.sessionLoading'));

  const access = await guardPage(options.requiredRoles || []);
  if (access.status === 'redirected') return null;

  if (access.status === 'forbidden') {
    return initializePage({
      ...options,
      user: access.user,
      onLogout: logout,
      content: createForbiddenState(I18n)
    });
  }

  if (access.status === 'error') {
    return initializePage({
      ...options,
      user: access.user,
      onLogout: logout,
      content: createErrorState(I18n, 'states.sessionError')
    });
  }

  return initializePage({ ...options, user: access.user, onLogout: logout });
}
