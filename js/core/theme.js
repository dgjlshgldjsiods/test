const THEMES = Object.freeze(['light', 'dark']);

export class ThemeManager {
  constructor(options = {}) {
    this.storage = options.storage || globalThis.localStorage;
    this.storageKey = options.storageKey || 'itsm.theme';
    this.defaultTheme = THEMES.includes(options.defaultTheme) ? options.defaultTheme : 'light';
  }

  getTheme() {
    try {
      const stored = this.storage.getItem(this.storageKey);
      return THEMES.includes(stored) ? stored : this.defaultTheme;
    } catch {
      return this.defaultTheme;
    }
  }

  setTheme(theme) {
    if (!THEMES.includes(theme)) throw new RangeError('Unsupported theme: ' + theme);
    this.storage.setItem(this.storageKey, theme);
    this.apply(theme);
    return theme;
  }

  apply(theme = this.getTheme()) {
    globalThis.document?.documentElement?.setAttribute('data-bs-theme', theme);
    return theme;
  }
}

const config = globalThis.ITSM_CONFIG || {};
export const Theme = new ThemeManager({
  defaultTheme: config.defaultTheme,
  storageKey: config.themeStorageKey
});
