import { AppLayout } from './components/app-layout.js';
import { AppModal } from './components/modal.js';
import { ToastService } from './components/toast.js';
import { createErrorState, createForbiddenState, createLoadingState } from './components/page-states.js';
import { guardPage, logout } from './auth.js';

export function initializePage(options) {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('App root element was not found');
  }

  const config = window.ITSM_CONFIG || {};
  const theme = config.defaultTheme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.bsTheme = theme;

  const modal = new AppModal();
  const toasts = new ToastService();
  const layout = new AppLayout(root, {
    title: options.title,
    activeNav: options.activeNav || '',
    content: options.content || 'Базовая структура страницы готова.',
    user: options.user || null,
    onLogout: options.onLogout || null
  });

  layout.render();
  modal.mount(document.body);
  toasts.mount(document.body);

  return Object.freeze({ layout, modal, toasts });
}

export async function initializeProtectedPage(options) {
  const root = document.getElementById('app');
  if (!root) throw new Error('App root element was not found');
  root.replaceChildren(createLoadingState('Проверяем пользовательскую сессию…'));

  const access = await guardPage(options.requiredRoles || []);
  if (access.status === 'redirected') return null;

  if (access.status === 'forbidden') {
    return initializePage({
      ...options,
      user: access.user,
      onLogout: logout,
      content: createForbiddenState()
    });
  }

  if (access.status === 'error') {
    return initializePage({
      ...options,
      user: access.user,
      onLogout: logout,
      content: createErrorState('Не удалось проверить пользовательскую сессию. Повторите попытку позже.')
    });
  }

  return initializePage({ ...options, user: access.user, onLogout: logout });
}
