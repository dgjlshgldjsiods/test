import { authSession, getSafeReturnUrl, login, verifyCurrentUser } from '../auth.js';
import { I18n } from '../i18n/index.js';
import { Theme } from '../core/theme.js';

const form = document.getElementById('login-form');
const loginInput = document.getElementById('login');
const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('login-submit');
const submitLabel = submitButton.querySelector('.login-submit-label');
const submitSpinner = submitButton.querySelector('.login-submit-spinner');
const errorPanel = document.getElementById('login-error');
const languageSelect = document.getElementById('login-language');
const themeSelect = document.getElementById('login-theme');

applyPreferences();

languageSelect.addEventListener('change', () => {
  I18n.setLanguage(languageSelect.value);
  authSession.setLanguage(languageSelect.value);
  applyTranslations();
});

themeSelect.addEventListener('change', () => Theme.setTheme(themeSelect.value));

if (authSession.getSessionToken()) {
  try {
    const user = await verifyCurrentUser();
    if (user) globalThis.location.replace(getSafeReturnUrl());
  } catch {
    // Сетевая ошибка не блокирует повторный ручной вход.
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorPanel.classList.add('d-none');
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;

  setPending(true);
  try {
    await login(loginInput.value.trim(), passwordInput.value);
    passwordInput.value = '';
    globalThis.location.replace(getSafeReturnUrl());
  } catch (error) {
    passwordInput.value = '';
    errorPanel.textContent = I18n.t(error.code === 'INVALID_CREDENTIALS'
      ? 'login.invalidCredentials'
      : 'login.error');
    errorPanel.classList.remove('d-none');
  } finally {
    setPending(false);
  }
});

function setPending(pending) {
  submitButton.disabled = pending;
  loginInput.disabled = pending;
  passwordInput.disabled = pending;
  submitLabel.textContent = I18n.t(pending ? 'login.pending' : 'login.submit');
  submitSpinner.classList.toggle('d-none', !pending);
}

function applyPreferences() {
  languageSelect.value = I18n.getLanguage();
  themeSelect.value = Theme.apply();
  applyTranslations();
}

function applyTranslations() {
  I18n.translateDocument();
  document.title = I18n.t('pages.login') + ' — ITSM';
  languageSelect.setAttribute('aria-label', I18n.t('common.language'));
  themeSelect.setAttribute('aria-label', I18n.t('common.theme'));
  themeSelect.options[0].textContent = I18n.t('common.lightTheme');
  themeSelect.options[1].textContent = I18n.t('common.darkTheme');
  if (!submitButton.disabled) submitLabel.textContent = I18n.t('login.submit');
}
