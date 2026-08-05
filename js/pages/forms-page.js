import { initializeProtectedPage } from '../app.js';
import { PAGE_ROLES } from '../core/permissions.js';

await initializeProtectedPage({
  titleKey: 'pages.forms',
  activeNav: 'admin-forms',
  requiredRoles: PAGE_ROLES.forms,
  contentKey: 'pages.stub'
});
