import { I18nService, normalizeLanguage } from '../js/core/i18n.js';
import { ThemeManager } from '../js/core/theme.js';
import { ru } from '../js/i18n/ru.js';
import { en } from '../js/i18n/en.js';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

QUnit.module('I18n', () => {
  QUnit.test('возвращает русский и английский перевод', (assert) => {
    const i18n = new I18nService({ dictionaries: { ru, en }, storage: createMemoryStorage(), defaultLanguage: 'ru' });
    assert.strictEqual(i18n.t('common.logout'), 'Выйти');
    i18n.setLanguage('en');
    assert.strictEqual(i18n.t('common.logout'), 'Sign out');
  });

  QUnit.test('сохраняет выбранный язык', (assert) => {
    const storage = createMemoryStorage();
    const first = new I18nService({ dictionaries: { ru, en }, storage, defaultLanguage: 'ru' });
    first.setLanguage('en');
    const second = new I18nService({ dictionaries: { ru, en }, storage, defaultLanguage: 'ru' });
    assert.strictEqual(second.getLanguage(), 'en');
  });

  QUnit.test('использует fallback и возвращает ключ для неизвестного текста', (assert) => {
    const i18n = new I18nService({ dictionaries: { ru, en: {} }, storage: createMemoryStorage(), defaultLanguage: 'ru' });
    i18n.setLanguage('en');
    assert.strictEqual(i18n.t('common.cancel'), 'Отмена');
    assert.strictEqual(i18n.t('missing.key'), 'missing.key');
  });

  QUnit.test('нормализует поддерживаемые locale', (assert) => {
    assert.strictEqual(normalizeLanguage('EN-us'), 'en');
    assert.strictEqual(normalizeLanguage('de'), null);
  });
});

QUnit.module('ThemeManager', () => {
  QUnit.test('сохраняет light/dark и отклоняет неизвестную тему', (assert) => {
    const storage = createMemoryStorage();
    const theme = new ThemeManager({ storage, defaultTheme: 'light' });
    theme.setTheme('dark');
    assert.strictEqual(theme.getTheme(), 'dark');
    assert.throws(() => theme.setTheme('contrast'), RangeError);
  });
});
