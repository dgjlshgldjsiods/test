import { initializeProtectedPage } from '../app.js';
import { PAGE_ROLES } from '../core/permissions.js';

await initializeProtectedPage({
  title: 'Формы',
  activeNav: 'admin-forms',
  requiredRoles: PAGE_ROLES.forms,
  content: 'Бизнес-функции этой страницы будут реализованы на отдельном этапе.'
});
