import { AppLayout } from './components/app-layout.js';
import { AppModal } from './components/modal.js';
import { ToastService } from './components/toast.js';

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
    content: options.content || 'Базовая структура страницы готова.'
  });

  layout.render();
  modal.mount(document.body);
  toasts.mount(document.body);

  return Object.freeze({ layout, modal, toasts });
}
