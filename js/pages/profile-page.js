import { initializeProtectedPage } from '../app.js';

await initializeProtectedPage({
  title: 'Профиль',
  activeNav: 'profile',
  content: 'Бизнес-функции этой страницы будут реализованы на отдельном этапе.'
});
