const SUPPORTED_LANGUAGES = Object.freeze(['ru', 'en']);

export class I18nService {
  constructor(options) {
    this.dictionaries = options.dictionaries;
    this.storage = options.storage || globalThis.localStorage;
    this.storageKey = options.storageKey || 'itsm.language';
    this.defaultLanguage = normalizeLanguage(options.defaultLanguage) || 'ru';
    this.language = this.readStoredLanguage() || this.defaultLanguage;
  }

  t(key, params = {}) {
    const value = readPath(this.dictionaries[this.language], key)
      ?? readPath(this.dictionaries[this.defaultLanguage], key);
    if (typeof value !== 'string') return key;
    return value.replace(/\{(\w+)\}/g, (match, name) => (
      Object.hasOwn(params, name) ? String(params[name]) : match
    ));
  }

  setLanguage(language) {
    const normalized = normalizeLanguage(language);
    if (!normalized || !this.dictionaries[normalized]) {
      throw new RangeError('Unsupported language: ' + language);
    }
    this.language = normalized;
    this.storage.setItem(this.storageKey, normalized);
    this.applyDocumentLanguage();
    return normalized;
  }

  getLanguage() {
    return this.language;
  }

  applyDocumentLanguage() {
    if (globalThis.document?.documentElement) {
      globalThis.document.documentElement.lang = this.language;
    }
  }

  translateDocument(root = globalThis.document) {
    if (!root?.querySelectorAll) return;
    root.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = this.t(element.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      element.setAttribute('aria-label', this.t(element.dataset.i18nAriaLabel));
    });
    this.applyDocumentLanguage();
  }

  readStoredLanguage() {
    try {
      return normalizeLanguage(this.storage.getItem(this.storageKey));
    } catch {
      return null;
    }
  }
}

export function normalizeLanguage(language) {
  const normalized = typeof language === 'string' ? language.toLowerCase().split('-')[0] : '';
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : null;
}

function readPath(dictionary, key) {
  return String(key).split('.').reduce((value, part) => value?.[part], dictionary);
}
