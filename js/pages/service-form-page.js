import { initializeProtectedPage } from '../app.js';

await initializeProtectedPage({
  title: 'Создание заявки',
  activeNav: 'catalog',
  content: 'Бизнес-функции этой страницы будут реализованы на отдельном этапе.'
});
