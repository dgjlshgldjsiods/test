import { initializeProtectedPage } from '../app.js';

await initializeProtectedPage({
  title: 'Карточка заявки',
  activeNav: 'requests',
  content: 'Бизнес-функции этой страницы будут реализованы на отдельном этапе.'
});
