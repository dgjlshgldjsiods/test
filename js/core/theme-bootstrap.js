(function applyStoredTheme() {
  var config = window.ITSM_CONFIG || {};
  var storageKey = config.themeStorageKey || 'itsm.theme';
  var fallback = config.defaultTheme === 'dark' ? 'dark' : 'light';
  var theme = fallback;
  try {
    var stored = window.localStorage.getItem(storageKey);
    if (stored === 'light' || stored === 'dark') theme = stored;
  } catch (error) {
    // Storage can be unavailable; the configured default remains usable.
  }
  document.documentElement.setAttribute('data-bs-theme', theme);
})();
