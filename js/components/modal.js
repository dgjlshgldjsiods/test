import { createElement } from './dom.js';

export class AppModal {
  constructor(i18n) {
    this.i18n = i18n;
    this.element = this.create();
    this.bootstrapModal = null;
  }

  mount(parent) {
    if (!this.element.isConnected) parent.append(this.element);
    if (window.bootstrap && window.bootstrap.Modal) {
      this.bootstrapModal = window.bootstrap.Modal.getOrCreateInstance(this.element);
    }
  }

  show({ title, body, confirmText, onConfirm } = {}) {
    this.titleElement.textContent = title || '';
    this.bodyElement.replaceChildren();
    this.bodyElement.append(createElement('p', { className: 'mb-0', text: body || '' }));
    this.confirmButton.textContent = confirmText || this.i18n.t('common.continue');
    this.confirmButton.onclick = () => {
      if (typeof onConfirm === 'function') onConfirm();
      this.hide();
    };
    if (this.bootstrapModal) this.bootstrapModal.show();
  }

  hide() {
    if (this.bootstrapModal) this.bootstrapModal.hide();
  }

  create() {
    const modal = createElement('div', {
      className: 'modal fade',
      attributes: { tabindex: '-1', 'aria-hidden': 'true' }
    });
    const dialog = createElement('div', { className: 'modal-dialog modal-dialog-centered' });
    const content = createElement('div', { className: 'modal-content' });
    const header = createElement('div', { className: 'modal-header' });
    this.titleElement = createElement('h2', { className: 'modal-title fs-5' });
    const close = createElement('button', {
      className: 'btn-close',
      attributes: { type: 'button', 'data-bs-dismiss': 'modal', 'aria-label': this.i18n.t('common.close') }
    });
    this.bodyElement = createElement('div', { className: 'modal-body' });
    const footer = createElement('div', { className: 'modal-footer' });
    const cancel = createElement('button', {
      className: 'btn btn-secondary',
      text: this.i18n.t('common.cancel'),
      attributes: { type: 'button', 'data-bs-dismiss': 'modal' }
    });
    this.confirmButton = createElement('button', { className: 'btn btn-primary', text: this.i18n.t('common.continue'), attributes: { type: 'button' } });
    header.append(this.titleElement, close);
    footer.append(cancel, this.confirmButton);
    content.append(header, this.bodyElement, footer);
    dialog.append(content);
    modal.append(dialog);
    return modal;
  }
}
