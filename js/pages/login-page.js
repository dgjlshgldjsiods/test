import { authSession, getSafeReturnUrl, login, verifyCurrentUser } from '../auth.js';

const form = document.getElementById('login-form');
const loginInput = document.getElementById('login');
const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('login-submit');
const submitLabel = submitButton.querySelector('.login-submit-label');
const submitSpinner = submitButton.querySelector('.login-submit-spinner');
const errorPanel = document.getElementById('login-error');

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
    errorPanel.textContent = error.code === 'INVALID_CREDENTIALS'
      ? 'Неверный логин или пароль.'
      : 'Не удалось выполнить вход. Повторите попытку позже.';
    errorPanel.classList.remove('d-none');
  } finally {
    setPending(false);
  }
});

function setPending(pending) {
  submitButton.disabled = pending;
  loginInput.disabled = pending;
  passwordInput.disabled = pending;
  submitLabel.textContent = pending ? 'Вход…' : 'Войти';
  submitSpinner.classList.toggle('d-none', !pending);
}
