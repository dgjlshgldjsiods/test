import { initializeProtectedPage } from '../app.js';
import { PAGE_ROLES } from '../core/permissions.js';

await initializeProtectedPage({
  title: 'Редактор формы',
  activeNav: 'admin-forms',
  requiredRoles: PAGE_ROLES.formEditor,
  content: 'Бизнес-функции этой страницы будут реализованы на отдельном этапе.'
});
