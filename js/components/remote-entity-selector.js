import { createElement } from './dom.js';

export class RemoteEntitySelector {
  constructor(options) {
    this.options = options;
    this.multiple = Boolean(options.multiple);
    this.value = this.multiple ? [] : null;
    this.element = createElement('div', { className: 'remote-selector' });
    this.search = createElement('input', {
      className: 'form-control form-control-sm mb-2',
      attributes: { type: 'search', placeholder: options.searchPlaceholder || options.label }
    });
    this.select = createElement('select', {
      className: 'form-select',
      attributes: { 'aria-label': options.label, ...(this.multiple ? { multiple: 'multiple', size: '5' } : {}) }
    });
    this.element.append(this.search, this.select);
    this.search.addEventListener('change', () => this.load({ search: this.search.value.trim() }));
    this.select.addEventListener('change', () => {
      this.value = this.multiple
        ? Array.from(this.select.selectedOptions, (option) => option.value)
        : this.select.value || null;
      options.onChange?.(this.value);
    });
  }

  async load(request = {}) {
    this.lastRequest = { ...(this.lastRequest || {}), ...request };
    this.select.disabled = true;
    try {
      const result = await this.options.load({ page: 1, pageSize: 100, ...this.lastRequest });
      const items = Array.isArray(result) ? result : result?.items || [];
      this.render(items);
    } finally {
      this.select.disabled = false;
    }
  }

  render(items) {
    const selected = new Set(this.multiple ? this.value : [this.value]);
    this.select.replaceChildren();
    if (!this.multiple) this.select.append(createElement('option', { text: this.options.emptyLabel || '—', attributes: { value: '' } }));
    items.forEach((item) => {
      const option = createElement('option', { text: this.options.getLabel?.(item) || item.title || item.name || item.id, attributes: { value: item.id } });
      option.selected = selected.has(String(item.id));
      this.select.append(option);
    });
  }

  setValue(value) {
    this.value = this.multiple ? (Array.isArray(value) ? value.map(String) : []) : value == null ? null : String(value);
    const selected = new Set(this.multiple ? this.value : [this.value]);
    Array.from(this.select.options).forEach((option) => { option.selected = selected.has(option.value); });
  }

  getValue() { return this.multiple ? [...this.value] : this.value; }
  setDisabled(disabled) { this.select.disabled = disabled; }
}
