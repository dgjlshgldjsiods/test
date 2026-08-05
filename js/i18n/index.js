import { I18nService } from '../core/i18n.js';
import { ru } from './ru.js';
import { en } from './en.js';

const config = globalThis.ITSM_CONFIG || {};

export const I18n = new I18nService({
  dictionaries: { ru, en },
  defaultLanguage: config.defaultLanguage,
  storageKey: config.languageStorageKey
});
