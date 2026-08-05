import { initializeProtectedPage } from '../app.js';
import { PAGE_ROLES } from '../core/permissions.js';

await initializeProtectedPage({
  title: 'Настройка SLA',
  activeNav: 'admin-sla',
  requiredRoles: PAGE_ROLES.slaEditor,
  content: 'Бизнес-функции этой страницы будут реализованы на отдельном этапе.'
});
