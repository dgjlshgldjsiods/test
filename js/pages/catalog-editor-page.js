import { initializeProtectedPage } from '../app.js';
import { PAGE_ROLES } from '../core/permissions.js';

await initializeProtectedPage({
  title: 'Редактор каталога',
  activeNav: 'admin-catalog',
  requiredRoles: PAGE_ROLES.catalogEditor,
  content: 'Бизнес-функции этой страницы будут реализованы на отдельном этапе.'
});
