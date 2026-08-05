import { createElement } from './dom.js';

export class ToastService {
  constructor(i18n) {
    this.i18n = i18n;
    this.region = createElement('div', {
      className: 'app-toast-region toast-container',
      attributes: { 'aria-live': 'polite', 'aria-atomic': 'true' }
    });
  }

  mount(parent) {
    if (!this.region.isConnected) parent.append(this.region);
  }

  show(message, variant = 'primary') {
    const toast = createElement('div', {
      className: 'toast align-items-center border-0 text-bg-' + variant,
      attributes: { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }
    });
    const row = createElement('div', { className: 'd-flex' });
    const body = createElement('div', { className: 'toast-body', text: message });
    const close = createElement('button', {
      className: 'btn-close btn-close-white me-2 m-auto',
      attributes: { type: 'button', 'data-bs-dismiss': 'toast', 'aria-label': this.i18n.t('common.close') }
    });
    row.append(body, close);
    toast.append(row);
    this.region.append(toast);
    if (window.bootstrap && window.bootstrap.Toast) {
      const instance = new window.bootstrap.Toast(toast);
      toast.addEventListener('hidden.bs.toast', () => toast.remove(), { once: true });
      instance.show();
    }
  }
}
